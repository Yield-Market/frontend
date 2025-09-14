import { ClobClient, OrderType, Side, ApiKeyCreds } from '@polymarket/clob-client'
import { ethers as Ethers } from 'ethers'
// import { logger } from '@/lib/logger' // Removed unused
import { POLYMARKET_CONFIG } from '@/lib/config'

/**
 * Minimal wrapper around Polymarket CLOB client to place IOC market orders.
 * This module does not store keys. It derives an API key per connected wallet session.
 */

export interface PlaceOrderParams {
  host?: string
  chainId?: number
  funder?: string
  tokenId: string
  price: number
  size: number
  side: 'BUY' | 'SELL'
  tickSize: string
  negRisk?: boolean
}

async function getBrowserSigner(): Promise<Ethers.Signer> {
  if (typeof window === 'undefined' || !(window as unknown as { ethereum?: unknown }).ethereum) {
    throw new Error('No wallet available. Please install or unlock a web3 wallet.')
  }
  const provider = new Ethers.providers.Web3Provider((window as unknown as { ethereum: unknown }).ethereum as Ethers.providers.ExternalProvider, 'any')
  // Request accounts if needed
  await provider.send('eth_requestAccounts', [])
  return provider.getSigner()
}

export async function deriveApiKey(host: string, chainId: number): Promise<ApiKeyCreds> {
  const signer = await getBrowserSigner()
  const client = new ClobClient(host, chainId, signer as unknown as Ethers.providers.JsonRpcSigner)
  return client.createOrDeriveApiKey()
}

export async function placePolymarketOrder(params: PlaceOrderParams) {
  const {
    host = 'https://clob.polymarket.com',
    chainId = 137,
    funder,
    tokenId,
    price,
    size,
    side,
    tickSize,
    negRisk = false
  } = params

  const mockEnabled = POLYMARKET_CONFIG.MOCK_ENABLED
  const mockBrowserEvent = POLYMARKET_CONFIG.MOCK_BROWSER_EVENT
  const isLocalChain = typeof window !== 'undefined' && (window as unknown as { ethereum?: { chainId?: string } })?.ethereum?.chainId === '0x539' // 1337

  // Mock path for local testing: sign payload and emit a browser event "pm:OrderFill"
  if (mockEnabled || isLocalChain || chainId !== 137) {
    const signer = await getBrowserSigner()
    const account = await signer.getAddress()
    const payload = {
      type: 'MockCLOBOrder',
      tokenId,
      price,
      size,
      side,
      tickSize,
      negRisk,
      account,
      ts: Date.now()
    }
    const signature = await (signer as unknown as { _signTypedData?: (domain: unknown, types: unknown, value: unknown) => Promise<string> })._signTypedData?.({}, {}, payload).catch(async () => {
      return await (signer as unknown as { signMessage?: (message: string) => Promise<string> }).signMessage?.(JSON.stringify(payload))
    })
    // Derive a pseudo orderHash for local debugging
    let orderHash: string | undefined
    try {
      orderHash = Ethers.utils.keccak256(Ethers.utils.toUtf8Bytes(JSON.stringify(payload)))
    } catch {}

    // emit mock fill event asynchronously (opt-in)
    if (mockBrowserEvent) {
      setTimeout(() => {
        try {
          const evt = new CustomEvent('pm:OrderFill', { detail: { tokenId, side, price, size, filled: size, signature, orderHash, mock: true } })
          window.dispatchEvent(evt)
        } catch {}
      }, 800)
    }

    return { mock: true, signature, orderHash, tokenId, price, size, side }
  }

  // Real CLOB flow
  const signer = await getBrowserSigner()
  const client = new ClobClient(host, chainId, signer as unknown as Ethers.providers.JsonRpcSigner)
  const creds = await client.createOrDeriveApiKey()

  const signatureType = 0 // 0 = Browser wallet (Metamask, Coinbase wallet, etc.)
  const clob = new ClobClient(host, chainId, signer as unknown as Ethers.providers.JsonRpcSigner, await creds, signatureType, funder)

  interface OrderRequest {
    tokenID: string
    price: number
    side: number
    size: number
    feeRateBps: number
    nonce: number
    expiration: number
  }
  
  interface OrderOptions {
    tickSize: string
    negRisk: boolean
  }
  
  interface OrderResponse {
    orderID: string
    [key: string]: unknown
  }
  
  const resp = await (clob as unknown as { createAndPostOrder: (order: OrderRequest, options: OrderOptions, orderType: number) => Promise<OrderResponse> }).createAndPostOrder(
    {
      tokenID: tokenId,
      price,
      side: side === 'BUY' ? Number(Side.BUY) : Number(Side.SELL),
      size,
      feeRateBps: 0,
      nonce: Date.now(),
      expiration: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
    },
    { tickSize, negRisk },
    Number(OrderType.GTC)
  )

  return resp
}


