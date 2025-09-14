'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useChainId, useConnect, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits, decodeEventLog } from 'viem'
import { CONDITIONAL_TOKENS_ABI, YM_VAULT_ABI, CLOB_EXCHANGE_EVENTS_ABI, SAFE_ABI } from '@/lib/abis'
// contracts.ts removed; all addresses come from markets-config.ts or hooks
import { useMarketOdds } from '@/hooks/useMarketOdds'
import { usePolymarketData } from '@/hooks/usePolymarket'
import { placePolymarketOrder } from '@/lib/polymarket'
import { getAllMarkets } from '@/lib/markets-config'
import { useVaultResolution } from '@/hooks/useVaultResolution'
import { SafeAddressCache } from '@/lib/safe-cache'
import { logger } from '@/lib/logger'
// Removed unused imports

interface TradingModalProps {
  isOpen: boolean
  onClose: () => void
  marketQuestion: string
  selectedOutcome: 'YES' | 'NO'
  currentOdds: number
  onConfirmTrade: (amount: string, outcome: 'YES' | 'NO') => void
  isTransacting?: boolean
  conditionId?: string
  positionId?: string
}

export function TradingModal({
  isOpen,
  onClose,
  marketQuestion,
  selectedOutcome,
  // currentOdds, // Removed unused prop
  onConfirmTrade,
  isTransacting = false,
  conditionId,
  positionId
}: TradingModalProps) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { writeContractAsync } = useWriteContract()
  const { connect, connectors } = useConnect()
  const [inputAmount, setInputAmount] = useState('')
  const [userBalance, setUserBalance] = useState('0.00')
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [ymBalance, setYmBalance] = useState('0.00')
  const [isYmBalanceLoading, setIsYmBalanceLoading] = useState(false)
  const [paymentAsset, setPaymentAsset] = useState<'USDC' | 'YES_TOKEN' | 'NO_TOKEN'>('YES_TOKEN')
  const [isAssetMenuOpen, setIsAssetMenuOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [selectedButton, setSelectedButton] = useState<'25' | '50' | '75' | 'MAX' | null>(null)
  const [tradeStep, setTradeStep] = useState<'idle' | 'buying' | 'transferring' | 'completed' | 'error'>('idle')
  const [completionContext, setCompletionContext] = useState<'order' | 'deposit' | 'withdraw' | null>(null)
  const [tradeError, setTradeError] = useState<string | null>(null)
  // const [bestHolder, setBestHolder] = useState<string | null>(null) // Removed unused
  const [bestPositionBal, setBestPositionBal] = useState<bigint | undefined>(undefined)

  // Get real odds from contract (fallback) - removed unused variables
  const { loading: oddsLoading } = useMarketOdds(conditionId)
  // Get Polymarket outcome prices as primary source
  const { yesPrice, noPrice, loading: pmLoading } = usePolymarketData(conditionId, 10000)
  const selectedPrice = selectedOutcome === 'YES' ? yesPrice : noPrice
  const displayOdds = selectedPrice && selectedPrice > 0 ? (1 / selectedPrice) : 0
  // Expected APY for yield after deposit (can be overridden per-market via markets-config.ts -> expectedApy)
  const marketCfgForApy = getAllMarkets().find(m => m.question === marketQuestion)
  const estimatedApy = typeof marketCfgForApy?.expectedApy === 'number' ? marketCfgForApy.expectedApy : 0.05

  // Get contract addresses using current chainId
  // const targetChainId = chainId || 1337 // Removed unused
  const marketCfgAll = getAllMarkets()
  const marketCfg = (conditionId
    ? marketCfgAll.find(m => (m.conditionId?.toLowerCase?.() === (conditionId as string).toLowerCase()))
    : marketCfgAll.find(m => m.question === marketQuestion))
  // For demo/local, allow using known polygon token addresses; ideally should come from config per chain
  const conditionalTokensAddress = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045'
  const mockUSDCAddress = marketCfg?.collateralToken || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  const { isResolved, yesWon, finalPayoutRatio, vaultAddress } = useVaultResolution(conditionId)
  logger.debug('TradingModal initialized', { isResolved, vaultAddress, conditionId })
  useEffect(() => {
    // silent init
  }, [conditionId, marketCfg, marketQuestion])
  useEffect(() => {
    if (!conditionId) return
  }, [conditionId, vaultAddress, isResolved, yesWon, finalPayoutRatio])

  // Query user USDC balance
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: mockUSDCAddress as `0x${string}`,
    abi: [
      {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address }
  })

  // Use cached version of Safe query
  const fetchSafesForOwner = async (owner?: string): Promise<string[]> => {
    if (!owner) return []
    return SafeAddressCache.getSafesForOwner(owner, chainId)
  }

  // Helper: read ym vault balance for YES.Y tokens
  const readYmBalance = async (): Promise<bigint | undefined> => {
    try {
      setIsYmBalanceLoading(true)

      if (!publicClient || !vaultAddress) {
        setYmBalance('0.00')
        return 0n
      }

      const holders: string[] = [address || '', ...await fetchSafesForOwner(address)].filter(Boolean)
      let best: { h?: string; b: bigint } = { b: 0n }

      for (const h of holders) {
        try {
          // Query corresponding token balance based on selectedOutcome
          const functionName = selectedOutcome === 'YES' ? 'getYesYBalance' : 'getNoYBalance'
          const balance: bigint = await publicClient.readContract({
            address: vaultAddress as `0x${string}`,
            abi: YM_VAULT_ABI,
            functionName: functionName,
            args: [h as `0x${string}`]
          }) as unknown as bigint

          console.log('[TM][YMBalance] holder', h, 'vaultAddress', vaultAddress, 'outcome', selectedOutcome, 'balance', balance.toString())

          if (balance > best.b) best = { h, b: balance }
        } catch (e) {
          console.log('[TM][YMBalance] Error querying holder', h, ':', e)
        }
      }

      setYmBalance(formatBalance(formatUnits(best.b, 6)))
      console.log('[TM][BestYMBalance] vaultAddress', vaultAddress, 'bestHolder', best.h, 'balance', best.b.toString())
      return best.b
    } catch (e) {
      console.log('[TM][YMBalance] Error:', e)
      return undefined
    } finally {
      setIsYmBalanceLoading(false)
    }
  }

  // Helper: read best balance across EOA + safes for current positionId from conditional tokens
  const readBestPositionBalance = async (): Promise<bigint | undefined> => {
    try {
      setIsBalanceLoading(true)

      if (!publicClient || !positionId) {
        setBestPositionBal(0n)
        setUserBalance('0.00')
        return 0n
      }

      const holders: string[] = [address || '', ...await fetchSafesForOwner(address)].filter(Boolean)
      const ctf = conditionalTokensAddress as `0x${string}`
      let best: { h?: string; b: bigint } = { b: 0n }

      for (const h of holders) {
        try {
          // Query conditional tokens contract's balanceOf function
          const b: bigint = await publicClient.readContract({
            address: ctf,
            abi: CONDITIONAL_TOKENS_ABI,
            functionName: 'balanceOf',
            args: [h as `0x${string}`, BigInt(positionId)]
          }) as unknown as bigint

          console.log('[TM][CTBalance] holder', h, 'positionId', positionId, 'balance', b.toString())

          if (b > best.b) best = { h, b }
        } catch (e) {
          console.log('[TM][CTBalance] Error querying holder', h, ':', e)
        }
      }

      // setBestHolder(best.h || null) // Removed unused
      setBestPositionBal(best.b)
      // Manually update balance display
      setUserBalance(formatBalance(formatUnits(best.b, 6)))
      console.log('[TM][BestCTBalance] positionId', positionId, 'bestHolder', best.h, 'balance', best.b.toString())
      return best.b
    } catch (e) {
      console.log('[TM][CTBalance] Error:', e)
      return undefined
    } finally {
      setIsBalanceLoading(false)
    }
  }

  // Format balance display, limit decimal places
  const formatBalance = (balance: string | number): string => {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance
    if (isNaN(num)) return '0.00'
    
    // If integer or decimal part is 0, show 2 decimal places
    if (num % 1 === 0) return num.toFixed(2)
    
    // Otherwise show at most 2 significant decimal places
    return num.toFixed(2)
  }

  // Update user balance when asset or balances change
  useEffect(() => {
    if (paymentAsset === 'USDC') {
      if (usdcBalance) setUserBalance(formatBalance(formatUnits(usdcBalance, 6)))
    } else if (paymentAsset === 'YES_TOKEN' || paymentAsset === 'NO_TOKEN') {
      if (bestPositionBal !== undefined && !isBalanceLoading) {
        setUserBalance(formatBalance(formatUnits(bestPositionBal as bigint, 6)))
      }
    }
  }, [paymentAsset, usdcBalance, bestPositionBal, isBalanceLoading])

  // Periodic balance refresh - refresh every 10 seconds
  useEffect(() => {
    if (!isConnected || !address) return

    const refreshInterval = setInterval(async () => {
      if (paymentAsset === 'USDC') {
        const result = await refetchUsdcBalance()
        if (result.data) {
          setUserBalance(formatBalance(formatUnits(result.data, 6)))
        }
      } else if (paymentAsset === 'YES_TOKEN' || paymentAsset === 'NO_TOKEN') {
        const b = await readBestPositionBalance()
        if (b !== undefined) setUserBalance(formatBalance(formatUnits(b as bigint, 6)))
      }
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(refreshInterval)
  }, [isConnected, address, paymentAsset, refetchUsdcBalance, readBestPositionBalance])

  // Function to deduct balance after transaction signature is sent
  const deductBalanceAfterSignature = (amount: string) => {
    const currentBalance = parseFloat(userBalance)
    const deductAmount = parseFloat(amount)
    const newBalance = Math.max(0, currentBalance - deductAmount)
    setUserBalance(formatBalance(newBalance))
  }

  // On open, default to selected direction token (YES or NO)
  useEffect(() => {
    if (!isOpen) return
    try {
      setPaymentAsset(selectedOutcome === 'YES' ? 'YES_TOKEN' : 'NO_TOKEN')
      setUserBalance('0.00')
      setYmBalance('0.00')
      setIsBalanceLoading(true)
      setIsYmBalanceLoading(true)
      ;(async () => {
        // Query both balances simultaneously
        await Promise.all([
          readBestPositionBalance(), // Query conditional tokens balance
          readYmBalance() // Query ym contract balance
        ])
      })()
    } catch {}
  }, [isOpen, selectedOutcome, conditionId, positionId, vaultAddress, readBestPositionBalance, readYmBalance])

  // Calculate expected payout using real odds
  const expectedPayout = inputAmount ? (parseFloat(inputAmount) * displayOdds).toFixed(2) : '0.00'
  const potentialProfit = inputAmount ? (parseFloat(expectedPayout) - parseFloat(inputAmount)).toFixed(2) : '0.00'

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Closing → clear everything and refresh balance
      setInputAmount('')
      setSelectedButton(null)
      setTradeStep('idle')
      setTradeError(null)
      setIsExecuting(false)
      setCompletionContext(null)
      
      // Refresh balance when closing to ensure latest balance is shown next time
      if (isConnected && address) {
        setTimeout(async () => {
          if (paymentAsset === 'USDC') {
            const result = await refetchUsdcBalance()
            if (result.data) {
              setUserBalance(formatBalance(formatUnits(result.data, 6)))
            }
          } else if (paymentAsset === 'YES_TOKEN' || paymentAsset === 'NO_TOKEN') {
            const b = await readBestPositionBalance()
            if (b !== undefined) setUserBalance(formatBalance(formatUnits(b as bigint, 6)))
          }
        }, 500) // Delayed refresh to avoid frequent calls
      }
    } else {
      // Re-open → make sure we are not stuck in a previous pending state
      setTradeStep('idle')
      setTradeError(null)
      setIsExecuting(false)
      setCompletionContext(null)
    }
  }, [isOpen, isConnected, address, paymentAsset, refetchUsdcBalance, readBestPositionBalance])

  const handleMaxClick = () => {
    setInputAmount(userBalance)
    setSelectedButton('MAX')
  }

  const handleQuickAmount = (percentage: number) => {
    const amount = (parseFloat(userBalance) * percentage / 100).toFixed(2)
    setInputAmount(amount)
    setSelectedButton(percentage.toString() as '25' | '50' | '75')
  }

  const handleConnectWallet = async () => {
    try {
      // Try to find OKX wallet first, then fallback to other connectors
      const okxConnector = connectors.find(c => c.name === 'Injected' && c.id === 'okxWallet')
      const connector = okxConnector || connectors[0] // Use OKX if available, otherwise first available

      await connect({ connector })
    } catch {
      // silent
      setTradeError('Failed to connect wallet')
    }
  }

  const handleConfirm = async () => {

    // Check all required conditions
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setTradeError('Please enter a valid amount')
      return
    }

    if (!isConnected || !address) {
      setTradeError('Please connect your wallet first')
      return
    }

    if (!conditionId || !positionId) {
      setTradeError('Missing market information')
      return
    }

    const parseError = (e: unknown): string => {
      if (!e) return 'Unknown error'
      if (e instanceof Error) return e.message
      try {
        const errorObj = e as Record<string, unknown>
        return (
          (errorObj?.shortMessage as string) ||
          (errorObj?.message as string) ||
          ((errorObj?.cause as Record<string, unknown>)?.shortMessage as string) ||
          ((errorObj?.cause as Record<string, unknown>)?.message as string) ||
          JSON.stringify(errorObj)
        )
      } catch {
        return String(e)
      }
    }

    try {
      setIsExecuting(true)
      setTradeError(null)

      // No longer deduct balance immediately, wait for transaction confirmation before updating

      // Prefer reading from markets-config.ts, match by conditionId first, then by question
      const allMkts = getAllMarkets()
      const marketCfg = (conditionId
        ? allMkts.find(m => (m.conditionId?.toLowerCase?.() === (conditionId as string).toLowerCase()))
        : undefined) || allMkts.find(m => m.question === marketQuestion)
      const cfgTokenIdYes = marketCfg?.clob?.tokenIdYes
      const cfgTokenIdNo = marketCfg?.clob?.tokenIdNo
      const cfgTickSize = marketCfg?.clob?.tickSize || process.env.NEXT_PUBLIC_PM_TICK_SIZE || '0.001'
      const cfgNegRisk = (String(marketCfg?.clob?.negRisk ?? process.env.NEXT_PUBLIC_PM_NEG_RISK ?? 'false') === 'true')

      const envTokenIdYes = process.env.NEXT_PUBLIC_PM_TOKEN_ID_YES
      const envTokenIdNo = process.env.NEXT_PUBLIC_PM_TOKEN_ID_NO

      const tokenIdFromConfig = selectedOutcome === 'YES' ? cfgTokenIdYes : cfgTokenIdNo
      const tokenIdFromEnv = selectedOutcome === 'YES' ? envTokenIdYes : envTokenIdNo
      const tokenIdFinal = tokenIdFromConfig || tokenIdFromEnv

      const useClob = !!tokenIdFinal

      if (paymentAsset === 'USDC' && useClob) {
        setTradeStep('buying')

        // If not on Polygon, use mock flow (placePolymarketOrder handles internally), no need to force chain switch

        // Track ERC1155 YES/NO token balance to detect fill
        // const vaultAddr = (marketCfg?.ymVaultAddress || '').toLowerCase() // Removed unused
        // const isBytes20 = /^0x[0-9a-fA-F]{40}$/.test(vaultAddr) // Removed unused
        // const isZero = vaultAddr === '0x0000000000000000000000000000000000000000' // Removed unused
        // const shouldDeposit = isBytes20 && !isZero // Removed unused

        let positionIdBig: bigint | undefined
        let balanceBefore: bigint | undefined
        try {
          positionIdBig = BigInt(positionId as string)
          balanceBefore = await publicClient!.readContract({
            address: conditionalTokensAddress as `0x${string}`,
            abi: CONDITIONAL_TOKENS_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`, positionIdBig]
          })
        } catch {}

        // Convert odds/price: prefer Polymarket price, fallback to odds → price
        // price ≈ 1 / odds
        const midPrice = (selectedPrice && selectedPrice > 0) ? selectedPrice : (displayOdds > 0 ? 1 / displayOdds : 0.5)
        const slippage = 0.05 // 5% slippage buffer
        const limitPrice = Math.min(0.99, Math.max(0.01, midPrice * (1 + slippage)))
        const size = parseFloat(inputAmount) / limitPrice

        const tokenId = tokenIdFinal
        if (!tokenId) {
          throw new Error('Missing Polymarket tokenId for selected outcome')
        }

        try {
          await placePolymarketOrder({
            tokenId,
            price: limitPrice,
            size,
            side: 'BUY',
            tickSize: cfgTickSize,
            negRisk: cfgNegRisk
          })

          // Mock-local flow: if not on Polygon, wait for local OrderFill event (on-chain or window event)
          const isPolygon = chainId === 137
          if (!isPolygon) {
            const waitForLocalFill = async () => {
              const fillContract = process.env.NEXT_PUBLIC_PM_MOCK_FILL_CONTRACT
              const fillTopic = process.env.NEXT_PUBLIC_PM_MOCK_FILL_EVENT_TOPIC // keccak256(OrderFilled(...))
              const timeoutMs = Number(process.env.NEXT_PUBLIC_PM_MOCK_TIMEOUT_MS || '15000')
              // Prefer chain logs if configured
              if (fillContract && fillTopic && publicClient) {
                // Poll logs (since viem publicClient in this env may not expose watchLogs)
                const from = await publicClient.getBlockNumber()
                const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
                const deadline = Date.now() + timeoutMs
                while (Date.now() < deadline) {
                  try {
                    // Use generic filter: provide only address and block range, then filter by topic manually
                    const logs = await publicClient.getLogs({
                      address: fillContract as `0x${string}`,
                      fromBlock: from,
                      toBlock: 'latest'
                    })
                    for (const l of logs) {
                      const topics: string[] = (l.topics || []) as string[]
                      if (!topics.includes(fillTopic)) continue
                      try {
                        decodeEventLog({ 
                          abi: CLOB_EXCHANGE_EVENTS_ABI, 
                          data: l.data as `0x${string}`, 
                          topics: topics as [`0x${string}`, ...`0x${string}`[]], 
                          eventName: 'OrderFilled' 
                        })
                        // silent
                      } catch {
                    // Ignore errors
                  }
                      return
                    }
                  } catch {
                    // Ignore errors
                  }
                  await sleep(800)
                }
                throw new Error('Timed out waiting for local OrderFill')
              }
              // Fallback: browser event dispatched by mock order helper
              const allowBrowserEvent = String(process.env.NEXT_PUBLIC_PM_MOCK_BROWSER_EVENT || '').toLowerCase() === 'true'
              // If browser events are not enabled, don't error, keep waiting until external manual trigger of pm:OrderFill
              return await new Promise<void>((resolve) => {
                const handler = () => {
                  window.removeEventListener('pm:OrderFill', handler as EventListener)
                  try {
                    // Order filled successfully
                  } catch {
                    // Ignore errors
                  }
                  resolve()
                }
                window.addEventListener('pm:OrderFill', handler as EventListener, { once: true })
                if (allowBrowserEvent) {
                  // If browser events are allowed, keep a timeout hint but don't reject to maintain "waiting" state
                  setTimeout(() => {
                    // silent
                  }, timeoutMs)
                }
              })
            }
            // Also poll user's ERC1155 position balance every 5s; if > balanceBefore, treat as filled
            const waitForBalanceIncrease = async () => {
              if (!positionIdBig) return
              const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
              // loop until balance increases
              while (true) {
                try {
                  const bal: bigint = await publicClient!.readContract({
                    address: conditionalTokensAddress as `0x${string}`,
                    abi: CONDITIONAL_TOKENS_ABI,
                    functionName: 'balanceOf',
                    args: [address as `0x${string}`, positionIdBig]
                  })
                  // Local mode: any current balance > 0 is considered filled
                  if (bal > 0n) return
                  // Standard mode: balance increase from before order is also considered filled
                  if (balanceBefore !== undefined && bal > (balanceBefore as bigint)) return
                } catch {}
                await sleep(5000)
              }
            }
            await Promise.race([waitForLocalFill(), waitForBalanceIncrease()])
            // Switch to corresponding asset view, clear input, prepare for subsequent deposit/operations
            setPaymentAsset(selectedOutcome === 'YES' ? 'YES_TOKEN' : 'NO_TOKEN')
            setInputAmount('')
            setSelectedButton(null)
            setCompletionContext('order')
          } else {
            // Real chain: watch OrderFilled from CLOB exchange contract if provided
            const exchangeAddr = process.env.NEXT_PUBLIC_PM_EXCHANGE_ADDRESS // optional
            const timeoutMs = Number(process.env.NEXT_PUBLIC_PM_WAIT_TIMEOUT_MS || '15000')
            if (exchangeAddr && publicClient) {
              const from = await publicClient.getBlockNumber()
              const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
              const deadline = Date.now() + timeoutMs
              const waitForBalanceIncrease = async () => {
                if (!positionIdBig) return
                const sleep2 = (ms: number) => new Promise(r => setTimeout(r, ms))
                while (true) {
                  try {
                    const bal: bigint = await publicClient!.readContract({
                      address: conditionalTokensAddress as `0x${string}`,
                      abi: CONDITIONAL_TOKENS_ABI,
                      functionName: 'balanceOf',
                      args: [address as `0x${string}`, positionIdBig]
                    })
                    if (bal > 0n) return
                    if (balanceBefore !== undefined && bal > (balanceBefore as bigint)) return
                  } catch {
                    // Ignore errors
                  }
                  await sleep2(5000)
                }
              }
              while (Date.now() < deadline) {
                try {
                  const logs = await publicClient.getLogs({
                    address: exchangeAddr as `0x${string}`,
                    fromBlock: from,
                    toBlock: 'latest'
                  })
                  let filled = false
                  for (const l of logs) {
                    try {
                      decodeEventLog({ 
                        abi: CLOB_EXCHANGE_EVENTS_ABI, 
                        data: l.data as `0x${string}`, 
                        topics: (l.topics || []) as [`0x${string}`, ...`0x${string}`[]], 
                        eventName: 'OrderFilled' 
                      })
                      // silent
                      filled = true
                      break
                    } catch {
                    // Ignore errors
                  }
                  }
                  if (filled) break
                } catch {}
                await sleep(1000)
                // in parallel, check balance increase condition with a quick tick (non-blocking) — skipped here since loop continues
              }
              // Also race with balance increase promise in case logs missed; we run once more synchronously
              try { await waitForBalanceIncrease() } catch {}
              if (true) {
                // After monitoring ends (filled captured), switch to corresponding asset view and clear input
                setPaymentAsset(selectedOutcome === 'YES' ? 'YES_TOKEN' : 'NO_TOKEN')
                setInputAmount('')
                setSelectedButton(null)
                setCompletionContext('order')
              }
            }
          }
        } catch (e) {
          setTradeStep('error')
          setTradeError(`CLOB order failed: ${parseError(e)}`)
          return
        }

        // No longer automatically deposit to Vault; stay in completed state, user manually inputs amount then clicks to deposit
        setTradeStep('completed')
        setCompletionContext(prev => prev || 'order')
      } else if (paymentAsset === 'USDC') {
        // Validate conditionId before attempting on-chain splitPosition
        const effectiveConditionId = conditionId || marketCfg?.conditionId
        const isValidBytes32 = !!(effectiveConditionId && /^0x[0-9a-fA-F]{64}$/.test(effectiveConditionId))
        if (!isValidBytes32) {
          setTradeStep('error')
          setTradeError('Missing valid conditionId (bytes32). Please fill src/lib/markets-config.ts or configure CLOB params.')
          return
        }
        // Fallback to legacy local flow: split positions and transfer to vault
        setTradeStep('buying')

        const amount = parseUnits(inputAmount, 6)
        const ymVaultAddress = marketCfg?.ymVaultAddress

        try {
          await writeContractAsync({
            address: conditionalTokensAddress as `0x${string}`,
            abi: CONDITIONAL_TOKENS_ABI,
            functionName: 'splitPosition',
            args: [
              mockUSDCAddress as `0x${string}`,
              '0x0000000000000000000000000000000000000000000000000000000000000000',
              effectiveConditionId as `0x${string}`,
              selectedOutcome === 'YES' ? [1n] : [0n],
              amount
            ]
          })

          // Deduct USDC balance after transaction signature is sent
          deductBalanceAfterSignature(inputAmount)
        } catch (e) {
          setTradeStep('error')
          setTradeError(e instanceof Error ? e.message : 'splitPosition failed')
          return
        }

        setTradeStep('transferring')

        try {
          await writeContractAsync({
            address: conditionalTokensAddress as `0x${string}`,
            abi: CONDITIONAL_TOKENS_ABI,
            functionName: 'safeTransferFrom',
            args: [
              address,
              (ymVaultAddress as `0x${string}`),
              BigInt(positionId),
              parseUnits(inputAmount, 6),
              '0x'
            ]
          })
        } catch (e) {
          setTradeStep('error')
          setTradeError(e instanceof Error ? e.message : 'ERC1155 transfer failed')
          return
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
        setCompletionContext('deposit')
      } else {
        // paymentAsset === 'YES_TOKEN' → directly deposit to vault
        if (!positionId) {
          setTradeError('Missing positionId for YES token')
          setTradeStep('error')
          return
        }
        // Convert input to base units (assume 6 decimals to stay consistent with USDC/Polymarket shares)
        const transferAmount = parseUnits(inputAmount, 6)
        // Optional safety: ensure balance is sufficient (EOA only; Safes handled later)
        let fromHolder: `0x${string}` = address as `0x${string}`
        let holderType: 'EOA' | 'SAFE' = 'EOA'
        try {
          // Reuse best-balance detection for the active outcome
          const holders: string[] = [address || '', ...await (async () => {
            try {
              if (!(chainId === 137 || chainId === 1337)) return []
              const ownerChecksum = address as `0x${string}`
              const resp = await fetch(`https://safe-transaction-polygon.safe.global/api/v1/owners/${ownerChecksum}/safes/`, { cache: 'no-store' })
              if (!resp.ok) return []
              const json = await resp.json()
              return Array.isArray(json?.safes) ? json.safes : []
            } catch { return [] }
          })()].filter(Boolean)

          let best: { h?: string; b: bigint } = { b: 0n }
          for (const h of holders) {
            try {
              const b: bigint = await publicClient!.readContract({
                address: conditionalTokensAddress as `0x${string}`,
                abi: CONDITIONAL_TOKENS_ABI,
                functionName: 'balanceOf',
                args: [h as `0x${string}`, BigInt(positionId)]
              }) as unknown as bigint
              if (b > best.b) best = { h, b }
            } catch {}
          }
          if (best.h) {
            fromHolder = best.h as `0x${string}`
            holderType = (fromHolder.toLowerCase() === (address as string).toLowerCase()) ? 'EOA' : 'SAFE'
            if (best.b < transferAmount) {
              setTradeStep('error')
              setTradeError('Insufficient YES token balance for transfer')
              return
            }
          }
        } catch {}

        // Check that vault can receive ERC1155 tokens
        try {
          if (!marketCfg || !marketCfg.ymVaultAddress) {
            setTradeStep('error')
            setTradeError('Missing ymVaultAddress in markets-config.ts')
            return
          }
          const canReceive: boolean = await publicClient!.readContract({
            address: (marketCfg.ymVaultAddress as `0x${string}`),
            abi: [
              {
                "inputs": [{ "name": "interfaceId", "type": "bytes4" }],
                "name": "supportsInterface",
                "outputs": [{ "name": "", "type": "bool" }],
                "stateMutability": "view",
                "type": "function"
              }
            ],
            functionName: 'supportsInterface',
            args: ['0x4e2312e0'] // IERC1155Receiver
          }) as unknown as boolean
          if (!canReceive) {
            setTradeStep('error')
            setTradeError('Vault does not implement ERC1155Receiver')
            return
          }
        } catch {}

        setTradeStep('transferring')
        try {
          if (!marketCfg || !marketCfg.ymVaultAddress) {
            setTradeStep('error')
            setTradeError('Missing ymVaultAddress in markets-config.ts')
            return
          }
          const toVault = marketCfg.ymVaultAddress as `0x${string}`
          if (holderType === 'EOA') {
            await writeContractAsync({
              address: conditionalTokensAddress as `0x${string}`,
              abi: CONDITIONAL_TOKENS_ABI,
              functionName: 'safeTransferFrom',
              args: [
                address,
                toVault,
                BigInt(positionId),
                transferAmount,
                '0x'
              ]
            })

            // Deduct token balance after transaction signature is sent
            deductBalanceAfterSignature(inputAmount)
          } else {
            // SAFE path (threshold=1 owner pre-validated): build execTransaction and use pre-validated signature
            const data = (await import('viem')).encodeFunctionData({
              abi: CONDITIONAL_TOKENS_ABI,
              functionName: 'safeTransferFrom',
              args: [fromHolder, toVault, BigInt(positionId), transferAmount, '0x']
            }) as `0x${string}`
            const SAFE_CALL_OPERATION = 0
            // Build pre-validated signature bytes for msg.sender owner
            const ownerBytes32 = (await import('viem')).padHex(address as `0x${string}`, { size: 32 }) as `0x${string}`
            const zero32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
            const v01 = '0x01' as `0x${string}`
            const signatures = (ownerBytes32 + zero32.slice(2) + v01.slice(2)) as `0x${string}`

            // Quick threshold check (optional, to avoid obvious reverts)
            try {
              const threshold: bigint = await publicClient!.readContract({
                address: fromHolder,
                abi: SAFE_ABI,
                functionName: 'getThreshold'
              }) as unknown as bigint
              if (threshold !== 1n) {
                throw new Error('Safe threshold != 1; multi-sig not implemented yet')
              }
            } catch (e) {
              throw e
            }

            await writeContractAsync({
              address: fromHolder,
              abi: SAFE_ABI,
              functionName: 'execTransaction',
              args: [
                conditionalTokensAddress as `0x${string}`,
                0n,
                data,
                SAFE_CALL_OPERATION,
                0n,
                0n,
                0n,
                '0x0000000000000000000000000000000000000000',
                '0x0000000000000000000000000000000000000000',
                signatures
              ]
            })

            // Deduct token balance after transaction signature is sent
            deductBalanceAfterSignature(inputAmount)
          }
        } catch (err) {
          setTradeStep('error')
          setTradeError(err instanceof Error ? err.message : 'Transfer failed')
          return
        }
        setCompletionContext('deposit')
      }

      // Completed; keep modal open, wait for user to manually close or subsequent actions
      setTradeStep('completed')
      setInputAmount('')
      
      // Refresh balance after transaction completion to ensure latest on-chain balance is displayed
      setTimeout(async () => {
        if (paymentAsset === 'USDC') {
          const result = await refetchUsdcBalance()
          if (result.data) {
            setUserBalance(formatBalance(formatUnits(result.data, 6)))
          }
        } else if (paymentAsset === 'YES_TOKEN' || paymentAsset === 'NO_TOKEN') {
          const b = await readBestPositionBalance()
          if (b !== undefined) setUserBalance(formatBalance(formatUnits(b as bigint, 6)))
        }

        // Refresh ym contract balance (should update after deposit)
        await readYmBalance()
      }, 2000) // Refresh after 2 seconds to give blockchain confirmation time
      
      // Notify parent component, but don't close modal in parent component
      await onConfirmTrade(inputAmount, selectedOutcome)
    } catch (error) {
      // Surface detailed error to help diagnose issues
      // silent
      setTradeStep('error')
      setTradeError(parseError(error))
      
      // Restore balance when transaction fails, because balance was deducted after signature was sent
      setTimeout(async () => {
        if (paymentAsset === 'USDC') {
          const result = await refetchUsdcBalance()
          if (result.data) {
            setUserBalance(formatBalance(formatUnits(result.data, 6)))
          }
        } else if (paymentAsset === 'YES_TOKEN' || paymentAsset === 'NO_TOKEN') {
          const b = await readBestPositionBalance()
          if (b !== undefined) setUserBalance(formatBalance(formatUnits(b as bigint, 6)))
        }
      }, 500) // Refresh after short delay
    } finally {
      setIsExecuting(false)
    }
  }

  const isValidAmount = inputAmount && parseFloat(inputAmount) > 0 && parseFloat(inputAmount) <= parseFloat(userBalance)

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Trade Position</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Market Info */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">Market</div>
            <div className="font-medium text-gray-900 leading-tight mb-3">{marketQuestion}</div>

            {/* Current Market Token Balances */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-sm font-medium text-blue-900 flex justify-between items-center">
                <span>Your Current Holding:</span>
                {isYmBalanceLoading ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <span className="font-semibold">{ymBalance} {selectedOutcome}.Y</span>
                )}
              </div>
            </div>
          </div>

          {/* From Section */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">You Pay</span>
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  Balance:
                  {isBalanceLoading ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <span>{userBalance} {paymentAsset === 'USDC' ? 'USDC' : selectedOutcome}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => {
                    setInputAmount(e.target.value)
                    // Clear selected button when user manually types
                    setSelectedButton(null)
                  }}
                  placeholder="0.00"
                  className="bg-transparent text-2xl font-bold text-gray-900 border-none outline-none flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAssetMenuOpen(v => !v)}
                    className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {paymentAsset === 'USDC' ? '$' : (selectedOutcome === 'YES' ? 'Y' : 'N')}
                    </div>
                    <span className="font-medium text-gray-900">{paymentAsset === 'USDC' ? 'USDC' : selectedOutcome}</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isAssetMenuOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${paymentAsset!=='USDC' ? 'text-blue-600' : 'text-gray-900'}`}
                        onClick={() => { setPaymentAsset(selectedOutcome === 'YES' ? 'YES_TOKEN' : 'NO_TOKEN'); setIsAssetMenuOpen(false) }}
                      >{selectedOutcome} Token</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {[25, 50, 75].map((percentage) => {
                  const isSelected = selectedButton === percentage.toString()
                  return (
                    <button
                      key={percentage}
                      onClick={() => handleQuickAmount(percentage)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-100 border border-blue-200 text-blue-800'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {percentage}%
                    </button>
                  )
                })}
                <button
                  onClick={handleMaxClick}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selectedButton === 'MAX'
                      ? 'bg-blue-100 border border-blue-200 text-blue-800'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Trade Details */}
          {inputAmount && parseFloat(inputAmount) > 0 && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Current Odds</span>
                <span>{(pmLoading && oddsLoading) ? '...' : `${displayOdds.toFixed(2)}x`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Potential Profit</span>
                <span className="text-green-600">+{potentialProfit} USDC</span>
              </div>
              {(parseFloat(inputAmount || '0') > 0) && (
                <div className="flex justify-between text-gray-600">
                  <span>Expected APY</span>
                  <span className="text-green-600">~{(estimatedApy * 100).toFixed(2)}%</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Network Fee</span>
                <span>~$0.50</span>
              </div>
            </div>
          )}

          {/* Trade Status */}
          {tradeStep !== 'idle' && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  tradeStep === 'buying' ? 'bg-blue-500 animate-pulse' :
                  tradeStep === 'transferring' ? 'bg-blue-500 animate-pulse' :
                  tradeStep === 'completed' ? 'bg-green-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-blue-700">
                  {tradeStep === 'buying' && paymentAsset === 'USDC' && 'Waiting for order fill on CLOB...'}
                  {tradeStep === 'transferring' && 'Depositing to YM Vault...'}
                  {tradeStep === 'completed' && (
                    completionContext === 'deposit'
                      ? 'Deposit completed successfully.'
                      : 'Order filled successfully. You can now deposit YES to earn yield.'
                  )}
                  {tradeStep === 'error' && `Error: ${tradeError}`}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={!isConnected ? handleConnectWallet : (isResolved ? async () => {
              try {
                setIsExecuting(true)
                if (!vaultAddress) throw new Error('Missing ymVaultAddress')

                console.log('[Withdraw][Start] Starting withdrawal check - Vault address:', vaultAddress, 'User address:', address)

                // First check user (EOA) balance
                let userYesY: bigint = 0n
                let userNoY: bigint = 0n
                try {
                  userYesY = await publicClient!.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: YM_VAULT_ABI,
                    functionName: 'getYesYBalance',
                    args: [address as `0x${string}`]
                  }) as unknown as bigint
                  userNoY = await publicClient!.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: YM_VAULT_ABI,
                    functionName: 'getNoYBalance',
                    args: [address as `0x${string}`]
                  }) as unknown as bigint
                  // Fallback to public mapping accessors if custom getters revert
                  if (userYesY === undefined || userYesY === null) {
                    try { userYesY = await publicClient!.readContract({ address: vaultAddress as `0x${string}`, abi: YM_VAULT_ABI, functionName: 'yesYTokens', args: [address as `0x${string}`] }) as unknown as bigint } catch {}
                  }
                  if (userNoY === undefined || userNoY === null) {
                    try { userNoY = await publicClient!.readContract({ address: vaultAddress as `0x${string}`, abi: YM_VAULT_ABI, functionName: 'noYTokens', args: [address as `0x${string}`] }) as unknown as bigint } catch {}
                  }
                } catch {}

                const userTotalBalance = (userYesY ?? 0n) + (userNoY ?? 0n)
                console.log('[Withdraw][UserBalance] EOA address:', address, 'YES.Y balance:', String(userYesY ?? 0n), 'NO.Y balance:', String(userNoY ?? 0n), 'Total balance:', String(userTotalBalance))

                 if (userTotalBalance > 0n) {
                   // User balance > 0, directly call ymVaultAddress withdraw, specify user address
                   console.log('[Withdraw][Direct] User EOA has balance, directly call vault withdraw - balance:', String(userTotalBalance))
                   await writeContractAsync({
                     address: vaultAddress as `0x${string}`,
                     abi: YM_VAULT_ABI,
                     functionName: 'withdraw',
                     args: [address as `0x${string}`] as [`0x${string}`]
                   })
                 } else {
                   // User balance is 0, check Safe balances
                   console.log('[Withdraw][CheckSafes] User EOA balance is 0, starting to check Safe balances')
                   const safes = await fetchSafesForOwner(address)
                   console.log('[Withdraw][Safes] Found Safes:', safes)

                   let bestSafe: { address?: string; balance: bigint } = { balance: 0n }

                   for (const safeAddr of safes) {
                     try {
                       let safeYesY: bigint = await publicClient!.readContract({
                         address: vaultAddress as `0x${string}`,
                         abi: YM_VAULT_ABI,
                         functionName: 'getYesYBalance',
                         args: [safeAddr as `0x${string}`]
                       }) as unknown as bigint
                       let safeNoY: bigint = await publicClient!.readContract({
                         address: vaultAddress as `0x${string}`,
                         abi: YM_VAULT_ABI,
                         functionName: 'getNoYBalance',
                         args: [safeAddr as `0x${string}`]
                       }) as unknown as bigint
                       // Fallback to public mapping accessors if custom getters revert
                       if (safeYesY === undefined || safeYesY === null) {
                         try { safeYesY = await publicClient!.readContract({ address: vaultAddress as `0x${string}`, abi: YM_VAULT_ABI, functionName: 'yesYTokens', args: [safeAddr as `0x${string}`] }) as unknown as bigint } catch {}
                       }
                       if (safeNoY === undefined || safeNoY === null) {
                         try { safeNoY = await publicClient!.readContract({ address: vaultAddress as `0x${string}`, abi: YM_VAULT_ABI, functionName: 'noYTokens', args: [safeAddr as `0x${string}`] }) as unknown as bigint } catch {}
                       }
                       const safeTotal = (safeYesY ?? 0n) + (safeNoY ?? 0n)
                       console.log('[Withdraw][SafeBalance] Safe address:', safeAddr, 'YES.Y balance:', String(safeYesY ?? 0n), 'NO.Y balance:', String(safeNoY ?? 0n), 'Total balance:', String(safeTotal))
                       if (safeTotal > bestSafe.balance) bestSafe = { address: safeAddr, balance: safeTotal }
                     } catch {
                    // Ignore errors
                  }
                   }

                   if (!bestSafe.address || bestSafe.balance === 0n) {
                     throw new Error('No yield token balance found in user account or safes')
                   }

                   // Use Safe's executeTransaction interface, call withdraw(address to) to specify user address
                   console.log('[Withdraw][SafeExecute] Selected Safe address:', bestSafe.address, 'Balance:', String(bestSafe.balance), 'Withdraw to user address:', address)

                   const { encodeFunctionData, padHex } = await import('viem')
                   const data = encodeFunctionData({ abi: YM_VAULT_ABI, functionName: 'withdraw', args: [address as `0x${string}`] }) as `0x${string}`

                   // Check threshold == 1
                   try {
                     const threshold: bigint = await publicClient!.readContract({
                       address: bestSafe.address as `0x${string}`,
                       abi: SAFE_ABI,
                       functionName: 'getThreshold'
                     }) as unknown as bigint
                     if (threshold !== 1n) throw new Error('Safe threshold != 1; multi-sig withdraw not implemented')
                   } catch (e) { throw e }

                   const ownerBytes32 = padHex(address as `0x${string}`, { size: 32 }) as `0x${string}`
                   const zero32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
                   const v01 = '0x01' as `0x${string}`
                   const signatures = (ownerBytes32 + zero32.slice(2) + v01.slice(2)) as `0x${string}`

                   await writeContractAsync({
                     address: bestSafe.address as `0x${string}`,
                     abi: SAFE_ABI,
                     functionName: 'execTransaction',
                     args: [
                       vaultAddress as `0x${string}`,
                       0n,
                       data,
                       0, // CALL
                       0n,
                       0n,
                       0n,
                       '0x0000000000000000000000000000000000000000',
                       '0x0000000000000000000000000000000000000000',
                       signatures
                     ]
                   })
                 }

                setTradeStep('completed')
              } catch (e) {
                setTradeStep('error')
                setTradeError(e instanceof Error ? e.message : 'Withdraw failed')
                console.error('[Withdraw][Error]', e)
              } finally {
                setIsExecuting(false)
              }
            } : handleConfirm)}
            disabled={(isResolved ? (isTransacting || isExecuting) : (!isValidAmount || isTransacting || isExecuting || tradeStep === 'buying' || tradeStep === 'transferring'))}
            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all ${
              (isResolved ? false : (!isValidAmount || !isConnected))
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isTransacting || isExecuting || tradeStep === 'buying' || tradeStep === 'transferring'
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : tradeStep === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {!isConnected
              ? 'Connect Wallet'
              : (isResolved
                ? 'Withdraw USDC'
                : (isTransacting || isExecuting || tradeStep === 'buying' || tradeStep === 'transferring'
                    ? (tradeStep === 'buying' ? 'Placing order...' : 'Depositing to YM Vault...')
                    : (tradeStep === 'completed'
                        ? ((paymentAsset === 'YES_TOKEN' || paymentAsset === 'NO_TOKEN') ? `Deposit ${selectedOutcome} to Yield` : `Buy ${selectedOutcome} to win ${expectedPayout} USDC`)
                        : (!inputAmount
                            ? 'Enter Amount'
                            : (!isValidAmount
                                ? 'Insufficient Balance'
                                : ((paymentAsset === 'YES_TOKEN' || paymentAsset === 'NO_TOKEN')
                                  ? `Deposit ${selectedOutcome} to Yield`
                                  : `Buy ${selectedOutcome} to win ${expectedPayout} USDC`))))))}
          </button>

          {/* Disclaimer */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            By trading, you agree to our terms and acknowledge the risks involved.
          </div>
        </div>
      </div>
    </div>
  )
}
