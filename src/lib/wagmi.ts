import { http, createConfig } from 'wagmi'
import { polygon, polygonAmoy, localhost, type Chain } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'
import { getRpcUrl, NETWORK_CONFIG } from './config'

// Define custom localhost chain with chainId 1337
const customLocalhost: Chain = {
  ...localhost,
  id: 1337,
  name: 'Localhost',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
}

// Get supported chains based on environment configuration
function getSupportedChains(): readonly [Chain, ...Chain[]] {
  const supportedChainIds = NETWORK_CONFIG.SUPPORTED_CHAINS
  const chains: Chain[] = []
  
  if (supportedChainIds.includes(1337)) {
    chains.push(customLocalhost)
  }
  if (supportedChainIds.includes(137)) {
    chains.push(polygon)
  }
  if (supportedChainIds.includes(80002)) {
    chains.push(polygonAmoy)
  }
  
  // Ensure at least one chain is supported
  if (chains.length === 0) {
    return [polygon]
  }
  
  return [chains[0], ...chains.slice(1)]
}

// Get transports for supported chains
function getTransports() {
  const supportedChainIds = NETWORK_CONFIG.SUPPORTED_CHAINS
  const transports: Record<number, ReturnType<typeof http>> = {}
  
  if (supportedChainIds.includes(1337)) {
    transports[1337] = http(getRpcUrl(1337))
  }
  if (supportedChainIds.includes(137)) {
    transports[137] = http(getRpcUrl(137))
  }
  if (supportedChainIds.includes(80002)) {
    transports[80002] = http(getRpcUrl(80002))
  }
  
  return transports
}

export const config = createConfig({
  chains: getSupportedChains(),
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Yield Market',
        url: 'https://yieldmarket.org',
        iconUrl: 'https://yieldmarket.org/favicon.ico',
      },
    }),
  ],
  transports: getTransports(),
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}