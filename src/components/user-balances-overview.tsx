'use client'

import { useMarketBalances, type ConditionInfo, type PositionBalance } from '@/hooks/useMarketBalances'
import { useMarketOdds } from '@/hooks/useMarketOdds'
import { useMarketStats } from '@/hooks/useMarketStats'
import { usePolymarketData } from '@/hooks/usePolymarket'
import { useVaultResolution } from '@/hooks/useVaultResolution'
import React, { useState } from 'react'
import { getAllMarkets } from '@/lib/markets-config'
import { Button } from '@/components/ui/button'
import { getStatusColor, getCategoryColor } from '@/components/market-icons'
import { MarketStatus } from '@/types'
import { TradingModal } from '@/components/trading-modal'
import { useAccount, useWriteContract, usePublicClient, useChainId } from 'wagmi'
import { YM_VAULT_ABI, CONDITIONAL_TOKENS_ABI, SAFE_ABI } from '@/lib/abis'
import { useMarket } from '@/contexts/market-context'
import { SafeAddressCache } from '@/lib/safe-cache'
import { logger } from '@/lib/logger'
import { CONTRACT_ADDRESSES } from '@/lib/config'

interface BalanceCardProps {
  position: PositionBalance
  onDeposit?: (position: PositionBalance, amount: string) => void
  onWithdraw?: (position: PositionBalance, amount: string) => void
  isTransacting?: boolean
}

function BalanceCard({ position, onDeposit, onWithdraw, isTransacting }: BalanceCardProps) {
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showDepositInput, setShowDepositInput] = useState(false)
  const [showWithdrawInput, setShowWithdrawInput] = useState(false)

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    }
    return Math.floor(value).toString()
  }

  const getOutcomeColor = (outcomeLabel: string, outcomeIndex: number) => {
    if (outcomeLabel === 'YES') return 'bg-green-50 border-green-200 text-green-800'
    if (outcomeLabel === 'NO') return 'bg-red-50 border-red-200 text-red-800'
    
    // For multiple choice, use different colors
    const colors = [
      'bg-blue-50 border-blue-200 text-blue-800',
      'bg-purple-50 border-purple-200 text-purple-800',
      'bg-yellow-50 border-yellow-200 text-yellow-800',
      'bg-pink-50 border-pink-200 text-pink-800',
    ]
    return colors[outcomeIndex % colors.length]
  }

  const handleDeposit = () => {
    if (depositAmount && onDeposit) {
      onDeposit(position, depositAmount)
      setDepositAmount('')
      setShowDepositInput(false)
    }
  }

  const handleWithdraw = () => {
    if (withdrawAmount && onWithdraw) {
      onWithdraw(position, withdrawAmount)
      setWithdrawAmount('')
      setShowWithdrawInput(false)
    }
  }

  const isYesNoToken = ['YES', 'NO'].includes(position.outcomeLabel)

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all border-gray-200 hover:border-gray-300 ${getOutcomeColor(position.outcomeLabel, position.outcomeIndex)}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-semibold text-sm">{position.outcomeLabel}</div>
        <div className="text-right">
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-lg font-bold">{formatValue(Number(position.balanceFormatted))}</span>
            <span className="text-xs text-gray-500">Positions</span>
          </div>
          {/* YM Vault breakdown for individual positions - single line */}
          {Number(position.balanceFormatted) > 0 && (
            <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
              <span className="inline-flex items-center gap-1 mr-1">
                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                <span>{formatValue(Number(position.yieldingBalanceFormatted))} yielding</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{formatValue(Number(position.idleBalanceFormatted))} idle</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="space-y-2">
        {!showDepositInput && !showWithdrawInput && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setShowDepositInput(true)}
              disabled={isTransacting || !isYesNoToken}
            >
              Deposit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={() => setShowWithdrawInput(true)}
              disabled={isTransacting || !isYesNoToken}
            >
              Withdraw
            </Button>
          </div>
        )}

        {showDepositInput && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Amount"
                max={position.idleBalanceFormatted}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setDepositAmount(position.idleBalanceFormatted)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 px-1 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 whitespace-nowrap"
              >
                Max:{formatValue(Number(position.idleBalanceFormatted))}
              </button>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={handleDeposit}
                disabled={!depositAmount || isTransacting}
              >
                {isTransacting ? '...' : 'Confirm'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => {
                  setShowDepositInput(false)
                  setDepositAmount('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {showWithdrawInput && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount"
                max={position.yieldingBalanceFormatted}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setWithdrawAmount(position.yieldingBalanceFormatted)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 px-1 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 whitespace-nowrap"
              >
                Max:{formatValue(Number(position.yieldingBalanceFormatted))}
              </button>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || isTransacting}
              >
                {isTransacting ? '...' : 'Confirm'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => {
                  setShowWithdrawInput(false)
                  setWithdrawAmount('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isYesNoToken && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded text-center">
            Multi-choice tokens coming soon
          </div>
        )}
      </div>

      {position.resolved && (
        <div className={`text-xs mt-2 px-2 py-1 rounded ${
          position.isWinning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {position.isWinning ? '🏆 Winner' : 'Not winning'}
        </div>
      )}
    </div>
  )
}

interface ConditionCardProps {
  condition: ConditionInfo
  onTradeClick?: (outcome: 'YES' | 'NO', condition: ConditionInfo) => void
  preloadedResolved?: boolean // New: preloaded resolution state
  loadingOutcome?: 'YES' | 'NO' | null // New: currently loading token type
}

function ConditionCard({ condition, onTradeClick, preloadedResolved, loadingOutcome }: ConditionCardProps) {
  // Get market odds from contract
  const { yesOdds, noOdds, loading: oddsLoading } = useMarketOdds(
    condition.conditionId,
    condition.positions.find(p => p.outcomeLabel === 'YES')?.positionId,
    condition.positions.find(p => p.outcomeLabel === 'NO')?.positionId
  )

  // Get market stats from YM: volume = idle + yielding (per requirement)
  const { volume, yielding, idle, loading: statsLoading, error: statsError } = useMarketStats(condition.conditionId)
  // YES/NO current prices from Polymarket: prefer slug from config if available
  const marketFromCfg = getAllMarkets().find(m => m.conditionId?.toLowerCase?.() === condition.conditionId.toLowerCase())
  const slugForPM = marketFromCfg?.slug
  const { yesPrice, noPrice, volume: pmVolume } = usePolymarketData(slugForPM || condition.conditionId, 10000, !!slugForPM)
  const { isResolved, vaultAddress } = useVaultResolution(condition.conditionId)
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const chainId = useChainId()
  const [withdrawing, setWithdrawing] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [estLoading, setEstLoading] = useState(false)
  const [estAmount, setEstAmount] = useState<number | null>(null)
  const [estError, setEstError] = useState<string | null>(null)
  
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    }
    return Math.floor(value).toString()
  }
  
  // Use real market stats from contract instead of position balances
  // idle uses Polymarket's volumeNum, yielding uses contract totalMatched
  const vaultMissing = !vaultAddress || /^0x0{40}$/i.test(vaultAddress as string)
  const idleDisplay = pmVolume !== undefined ? formatValue(pmVolume) : (statsLoading ? '...' : formatValue(0))
  const yieldingDisplay = (vaultMissing || statsError) ? '—' : (statsLoading ? '...' : formatValue(yielding))
  const includeYielding = !vaultMissing && !statsError
  const marketVolume = (pmVolume !== undefined && !statsLoading)
    ? formatValue(pmVolume + (includeYielding ? yielding : 0))
    : (statsLoading ? '...' : formatValue(includeYielding ? volume : (pmVolume ?? 0)))
  const idleDisplayWithDollar = idleDisplay === '...' ? '...' : `$${idleDisplay}`
  const yieldingDisplayWithDollar = (yieldingDisplay === '...' || yieldingDisplay === '—') ? yieldingDisplay : `$${yieldingDisplay}`
  const volumeDisplayWithDollar = marketVolume === '...' ? '...' : `$${marketVolume}`
  const marketYielding = statsLoading ? '...' : formatValue(yielding)
  const marketIdle = statsLoading ? '...' : formatValue(idle)

  const daysUntilExpiration = Math.ceil((condition.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])
  
  // Determine the actual status based on preloaded resolution state, expiration and current status
  const getActualStatus = () => {
    // Use preloaded resolution state if available, otherwise fall back to hook
    const resolvedState = preloadedResolved !== undefined ? preloadedResolved : isResolved
    
    // Prefer on-chain resolution state
    if (resolvedState) {
      return MarketStatus.Resolved
    }
    if (condition.status === MarketStatus.Resolved) {
      return MarketStatus.Resolved
    }
    if (daysUntilExpiration <= 0) {
      return MarketStatus.Expired
    }
    return condition.status
  }

  const actualStatus = mounted ? getActualStatus() : condition.status
  
  return (
    <div className={`bg-white dark:bg-[#2e3b5e] rounded-xl border-2 dark:border-[#34495e] transition-all hover:shadow-md ${getCategoryColor(condition.category)}`}>
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(actualStatus)}`}>
                    {actualStatus === MarketStatus.Open ? 'Open' : 
                     actualStatus === MarketStatus.Resolved ? 'Resolved' :
                     actualStatus === MarketStatus.Expired ? 'Expired' :
                     actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-[#e0e0e0] line-clamp-2 leading-tight">
                    {condition.question}
                  </h3>
                </div>
                {/* Volume breakdown - three equal elements */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-900 dark:text-[#e0e0e0]">{volumeDisplayWithDollar}</span>
                    <span className="text-xs text-gray-500 dark:text-[#a0a0a0]">volume</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    <span className="font-medium text-gray-700 dark:text-[#e0e0e0]">{yieldingDisplayWithDollar}</span>
                    <span className="text-xs text-gray-500 dark:text-[#a0a0a0]">yielding</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <span className="font-medium text-gray-700 dark:text-[#e0e0e0]">{idleDisplayWithDollar}</span>
                    <span className="text-xs text-gray-500 dark:text-[#a0a0a0]">idle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            {/* When resolved, show a single Withdraw button */}
            {isResolved ? (
              <button
                onClick={async () => {
                  try {
                    setShowWithdrawModal(true)
                    setEstLoading(true)
                    setEstError(null)
                    setEstAmount(null)

                    logger.transaction('Starting withdrawal balance query', {
                      vaultAddress,
                      address,
                      chainId
                    })

                    if (!vaultAddress || !address) {
                      if (!vaultAddress) {
                        logger.error('Vault address is empty')
                        setEstError('Vault address not configured for this market')
                      } else {
                        logger.error('User address is empty')
                        setEstError('Please connect your wallet')
                      }
                      return
                    }

                    // First check user (EOA) balance
                    let userYesY: bigint = 0n
                    let userNoY: bigint = 0n
                    try {
                      logger.balance('Querying EOA YES balance...')
                      userYesY = await publicClient!.readContract({
                        address: vaultAddress as `0x${string}`,
                        abi: YM_VAULT_ABI,
                        functionName: 'getYesYBalance',
                        args: [address as `0x${string}`]
                      }) as unknown as bigint
                      console.log('EOA YES balance:', userYesY.toString())

                      console.log('Querying EOA NO balance...')
                      userNoY = await publicClient!.readContract({
                        address: vaultAddress as `0x${string}`,
                        abi: YM_VAULT_ABI,
                        functionName: 'getNoYBalance',
                        args: [address as `0x${string}`]
                      }) as unknown as bigint
                      console.log('EOA NO balance:', userNoY.toString())

                      // Fallback to public mapping accessors if custom getters revert
                      if (userYesY === undefined || userYesY === null) {
                        console.log('YES balance is null, trying fallback query...')
                        try {
                          userYesY = await publicClient!.readContract({
                            address: vaultAddress as `0x${string}`,
                            abi: YM_VAULT_ABI,
                            functionName: 'yesYTokens',
                            args: [address as `0x${string}`]
                          }) as unknown as bigint
                          console.log('Fallback YES balance:', userYesY.toString())
                        } catch (e) {
                          console.log('Fallback YES query failed:', e)
                        }
                      }
                      if (userNoY === undefined || userNoY === null) {
                        console.log('NO balance is null, trying fallback query...')
                        try {
                          userNoY = await publicClient!.readContract({
                            address: vaultAddress as `0x${string}`,
                            abi: YM_VAULT_ABI,
                            functionName: 'noYTokens',
                            args: [address as `0x${string}`]
                          }) as unknown as bigint
                          console.log('Fallback NO balance:', userNoY.toString())
                        } catch (e) {
                          console.log('Fallback NO query failed:', e)
                        }
                      }
                    } catch (e) {
                      console.log('EOA balance query failed:', e)
                    }

                    const userTotalBalance = (userYesY ?? 0n) + (userNoY ?? 0n)
                    console.log('EOA total balance:', userTotalBalance.toString())

                    if (userTotalBalance > 0n) {
                      // User EOA has balance, use estimateWithdrawal
                      console.log('EOA has balance, querying estimateWithdrawal...')
                      const estimated: bigint = await publicClient!.readContract({
                        address: vaultAddress as `0x${string}`,
                        abi: YM_VAULT_ABI,
                        functionName: 'estimateWithdrawal',
                        args: [address as `0x${string}`]
                      }) as unknown as bigint
                      console.log('EOA estimateWithdrawal result:', estimated.toString())
                      setEstAmount(Number(estimated) / 1e6)
                    } else {
                      // User EOA balance is 0, check Safe balances (using cache)
                      console.log('EOA balance is 0, querying Safe balances...')
                      const safes = await SafeAddressCache.getSafesForOwner(address || '', chainId)
                      console.log('Found Safe addresses:', safes)
                      let bestSafe: { address?: string; balance: bigint } = { balance: 0n }

                      for (const safeAddr of safes) {
                        try {
                          console.log(`Querying Safe ${safeAddr} balance...`)
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
                          console.log(`Safe ${safeAddr} YES balance:`, safeYesY.toString())
                          console.log(`Safe ${safeAddr} NO balance:`, safeNoY.toString())

                          // Fallback to public mapping accessors if custom getters revert
                          if (safeYesY === undefined || safeYesY === null) {
                            try {
                              safeYesY = await publicClient!.readContract({
                                address: vaultAddress as `0x${string}`,
                                abi: YM_VAULT_ABI,
                                functionName: 'yesYTokens',
                                args: [safeAddr as `0x${string}`]
                              }) as unknown as bigint
                              console.log(`Safe ${safeAddr} Fallback YES balance:`, safeYesY.toString())
                            } catch (e) {
                              console.log(`Safe ${safeAddr} Fallback YES query failed:`, e)
                            }
                          }
                          if (safeNoY === undefined || safeNoY === null) {
                            try {
                              safeNoY = await publicClient!.readContract({
                                address: vaultAddress as `0x${string}`,
                                abi: YM_VAULT_ABI,
                                functionName: 'noYTokens',
                                args: [safeAddr as `0x${string}`]
                              }) as unknown as bigint
                              console.log(`Safe ${safeAddr} Fallback NO balance:`, safeNoY.toString())
                            } catch (e) {
                              console.log(`Safe ${safeAddr} Fallback NO query failed:`, e)
                            }
                          }
                          const safeTotal = (safeYesY ?? 0n) + (safeNoY ?? 0n)
                          console.log(`Safe ${safeAddr} total balance:`, safeTotal.toString())
                          if (safeTotal > bestSafe.balance) {
                            bestSafe = { address: safeAddr, balance: safeTotal }
                            console.log(`Updated best Safe: ${safeAddr}, balance: ${safeTotal.toString()}`)
                          }
                        } catch (e) {
                          console.log(`Safe ${safeAddr} query failed:`, e)
                        }
                      }

                      console.log('Best Safe:', bestSafe)
                      if (bestSafe.balance > 0n) {
                        // Safe has balance, use estimateWithdrawal to calculate Safe withdrawal amount
                        console.log('Safe has balance, querying estimateWithdrawal...')
                        const estimated: bigint = await publicClient!.readContract({
                          address: vaultAddress as `0x${string}`,
                          abi: YM_VAULT_ABI,
                          functionName: 'estimateWithdrawal',
                          args: [bestSafe.address as `0x${string}`]
                        }) as unknown as bigint
                        console.log('Safe estimateWithdrawal result:', estimated.toString())
                        setEstAmount(Number(estimated) / 1e6)
                      } else {
                        console.log('No balance found')
                        setEstAmount(0)
                      }
                    }
                  } catch (e) {
                    setEstError(e instanceof Error ? e.message : 'Failed to estimate withdrawal')
                  } finally {
                    setEstLoading(false)
                  }
                }}
                className="bg-blue-600 text-white rounded-lg text-center w-full sm:w-[268px] h-12 flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer"
              >
                {withdrawing ? 'Withdrawing...' : 'Withdraw USDC'}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => onTradeClick?.('YES', condition)}
                  disabled={loadingOutcome === 'YES'}
                  className={`bg-green-50 dark:bg-[#28a745] border border-green-200 dark:border-[#28a745] text-green-800 dark:text-white px-8 rounded-lg text-center w-32 h-12 flex flex-col items-center justify-center hover:bg-green-100 dark:hover:bg-[#218838] transition-colors cursor-pointer ${loadingOutcome === 'YES' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-bold text-xl flex items-center gap-2">
                    {loadingOutcome === 'YES' && (
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    YES
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-white">
                    {yesPrice === undefined ? '...' : `${(yesPrice * 100).toFixed(0)}%`}
                  </div>
                </button>
                <button
                  onClick={() => onTradeClick?.('NO', condition)}
                  disabled={loadingOutcome === 'NO'}
                  className={`bg-red-50 dark:bg-[#dc3545] border border-red-200 dark:border-[#dc3545] text-red-800 dark:text-white px-8 rounded-lg text-center w-32 h-12 flex flex-col items-center justify-center hover:bg-red-100 dark:hover:bg-[#c82333] transition-colors cursor-pointer ${loadingOutcome === 'NO' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-bold text-xl flex items-center gap-2">
                    {loadingOutcome === 'NO' && (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    NO
                  </div>
                  <div className="text-sm font-medium text-red-600 dark:text-white">
                    {noPrice === undefined ? '...' : `${(noPrice * 100).toFixed(0)}%`}
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Idle Token Annotation */}
        {(() => {
          const yesPosition = condition.positions.find(p => p.outcomeLabel === 'YES')
          const noPosition = condition.positions.find(p => p.outcomeLabel === 'NO')
          const yesIdle = yesPosition ? Number(yesPosition.idleBalanceFormatted) : 0
          const noIdle = noPosition ? Number(noPosition.idleBalanceFormatted) : 0
          
          if (yesIdle > 0 || noIdle > 0) {
            const formatAmount = (amount: number) => amount >= 1000 ? `${(amount/1000).toFixed(1)}K` : Math.floor(amount).toString()
            
            if (yesIdle > 0 && noIdle > 0) {
              return (
                <div className="mt-3 text-xs text-amber-700 dark:text-[#ffc107]">
                  You have {formatAmount(yesIdle)} USDC worth YES and NO tokens idle, click{' '}
                  <button
                    onClick={() => onTradeClick?.('YES', condition)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    YES
                  </button>
                  {' '}or{' '}
                  <button
                    onClick={() => onTradeClick?.('NO', condition)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    NO
                  </button>
                  {' '}button to yield
                </div>
              )
            } else if (yesIdle > 0) {
              return (
                <div className="mt-3 text-xs text-amber-700 dark:text-[#ffc107]">
                  You have {formatAmount(yesIdle)} USDC worth YES tokens idle, click{' '}
                  <button
                    onClick={() => onTradeClick?.('YES', condition)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    YES
                  </button>
                  {' '}button to yield
                </div>
              )
            } else if (noIdle > 0) {
              return (
                <div className="mt-3 text-xs text-amber-700 dark:text-[#ffc107]">
                  You have {formatAmount(noIdle)} USDC worth NO tokens idle, click{' '}
                  <button
                    onClick={() => onTradeClick?.('NO', condition)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    NO
                  </button>
                  {' '}button to yield
                </div>
              )
            }
          }
          return null
        })()}

        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-[#2e3b5e] rounded-xl p-6 w-full max-w-sm border border-gray-200 dark:border-[#34495e]">
              <div className="text-lg font-semibold mb-3 text-gray-900 dark:text-[#e0e0e0]">Confirm Withdrawal</div>
              <div className="text-sm text-gray-700 dark:text-[#e0e0e0] mb-4">
                {estLoading && 'Estimating available USDC...'}
                {!estLoading && estError && (
                  <span className="text-red-600">{estError}</span>
                )}
                {!estLoading && !estError && (
                  <span>You can withdraw <span className="font-semibold">{estAmount !== null ? `${estAmount.toFixed(2)} USDC` : '—'}</span></span>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                {estAmount !== 0 && (
                  <button
                    disabled={estLoading || withdrawing || !vaultAddress}
                    className="px-4 py-2 rounded text-white font-medium transition-colors bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                    try {
                      setWithdrawing(true)
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
                        console.log('[Withdraw][Direct] User EOA has balance, directly calling vault withdraw - balance:', String(userTotalBalance))
                        await writeContractAsync({
                          address: vaultAddress as `0x${string}`,
                          abi: YM_VAULT_ABI,
                          functionName: 'withdraw',
                          args: [address as `0x${string}`] as [`0x${string}`]
                        })
                      } else {
                        // User balance is 0, check Safe balances
                        console.log('[Withdraw][CheckSafes] User EOA balance is 0, starting to check Safe balances')

                        // Use cached version of Safe query
                        const safes = await SafeAddressCache.getSafesForOwner(address || '', chainId)
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
                          } catch {}
                        }

                        if (!bestSafe.address || bestSafe.balance === 0n) {
                          throw new Error('No yield token balance found in user account or safes')
                        }

                        // Use Safe's executeTransaction interface, call withdraw(address to) to specify user address
                        console.log('[Withdraw][SafeExecute] Selected Safe address:', bestSafe.address, 'balance:', String(bestSafe.balance), 'withdraw to user address:', address)

                        const { encodeFunctionData, padHex } = await import('viem')
                        const data = encodeFunctionData({ abi: YM_VAULT_ABI as any, functionName: 'withdraw', args: [address as `0x${string}`] }) as `0x${string}`

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

                      setShowWithdrawModal(false)
                    } catch (e) {
                      setEstError(e instanceof Error ? e.message : 'Withdraw failed')
                    } finally {
                      setWithdrawing(false)
                    }
                  }}
                >
                  {withdrawing ? 'Withdrawing...' : 'Confirm'}
                </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function UserBalancesOverview() {
  const { markets } = useMarket()

  // Get loading states and error handling from the hook
  const { loading, error, loadingOutcome, loadBalanceForOutcome } = useMarketBalances()

  // Calculate total positions: markets count * 2 (YES + NO positions per market)
  const totalPositions = markets.length * 2

  // Calculate total value: sum of yielding across all markets (sum of YMVault.totalMatched)
  const publicClient = usePublicClient()
  const [totalYieldingValue, setTotalYieldingValue] = React.useState<number>(0)
  const [resolvedMap, setResolvedMap] = React.useState<Record<string, boolean>>({})
  const [statusesLoaded, setStatusesLoaded] = React.useState<boolean>(false) // New: whether status loading is complete
  React.useEffect(() => {
    let cancelled = false
    const fetchTotal = async () => {
      try {
        const addrs = markets
          .map(m => (m.ymVaultAddress || '').toLowerCase())
          .filter(addr => addr && !/^0x0{40}$/.test(addr)) as `0x${string}`[]
        const calls = addrs.map(addr =>
          publicClient!.readContract({ address: addr, abi: YM_VAULT_ABI, functionName: 'totalMatched' })
            .then((v: any) => Number(v as bigint) / 1e6)
            .catch(() => 0)
        )
        const vals = await Promise.all(calls)
        if (!cancelled) setTotalYieldingValue(vals.reduce((a, b) => a + b, 0))
      } catch {
        if (!cancelled) setTotalYieldingValue(0)
      }
    }
    fetchTotal()
    const id = setInterval(fetchTotal, 10000)
    return () => { cancelled = true; clearInterval(id) }
  }, [markets, publicClient])

  // Build a quick map of on-chain resolved states for filtering
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setStatusesLoaded(false) // Start loading status
        console.log('[StatusLoader] Starting to load market statuses...')
        
        const entries: [string, boolean][] = []
        const ctfAddress = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"
        
        for (const m of markets) {
          if (!m.conditionId) continue
          try {
            // Query ConditionalTokens payoutDenominator to check if resolved
            const payoutDenominator: bigint = await publicClient!.readContract({
              address: ctfAddress as `0x${string}`,
              abi: CONDITIONAL_TOKENS_ABI,
              functionName: 'payoutDenominator',
              args: [m.conditionId as `0x${string}`]
            }) as unknown as bigint
            
            const isResolved = payoutDenominator !== undefined && payoutDenominator > 0n
            entries.push([m.conditionId, isResolved])
            
            console.log(`[StatusLoader] Market ${m.slug}: ${isResolved ? 'Resolved' : 'Open'} (denominator: ${payoutDenominator})`)
          } catch (e) {
            console.warn(`[StatusLoader] Failed to check resolution for ${m.slug}:`, e)
            // If query fails, default to unresolved
            entries.push([m.conditionId, false])
          }
        }
        
        if (!cancelled) {
          const obj: Record<string, boolean> = {}
          for (const [k, v] of entries) obj[k] = v
          setResolvedMap(obj)
          setStatusesLoaded(true) // Status loading complete
          console.log('[StatusLoader] All market statuses loaded:', obj)
        }
      } catch (e) {
        console.error('[StatusLoader] Error loading market statuses:', e)
        if (!cancelled) {
          setStatusesLoaded(true) // Set to loaded even if error occurs to avoid never showing
        }
      }
    })()
    return () => { cancelled = true }
  }, [markets, publicClient])
  const { isConnected } = useAccount()
  
  // Sorting and filtering state
  const [sortBy, setSortBy] = useState<'volume'>('volume')
  const [filterBy, setFilterBy] = useState<'all' | 'open' | 'resolved' | 'crypto' | 'political' | 'weather' | 'economics'>('all')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [volumeMap, setVolumeMap] = React.useState<Record<string, number>>({})
  // Fetch Polymarket volumes once to support volume sorting
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resp = await fetch('https://gamma-api.polymarket.com/markets?limit=2000&active=true', { cache: 'no-store' })
        const list = await resp.json()
        const m: Record<string, number> = {}
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item?.conditionId) m[item.conditionId.toLowerCase()] = Number(item.volumeNum || 0)
          }
        }
        if (!cancelled) setVolumeMap(m)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  // Trading modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES')
  const [selectedCondition, setSelectedCondition] = useState<ConditionInfo | null>(null)
  const [isTransacting, setIsTransacting] = useState(false)
  
  // Wallet connection toast state
  const [showWalletToast, setShowWalletToast] = useState(false)
  const [isToastFading, setIsToastFading] = useState(false)

  // Handle trade button click
  const handleTradeClick = async (outcome: 'YES' | 'NO', condition: ConditionInfo) => {
    if (!isConnected) {
      // Show wallet connection toast
      setShowWalletToast(true)
      setIsToastFading(false)
      // Start fade out after 2.5 seconds
      setTimeout(() => setIsToastFading(true), 2500)
      // Hide completely after 3 seconds
      setTimeout(() => setShowWalletToast(false), 3000)
      return
    }

    setSelectedOutcome(outcome)
    setSelectedCondition(condition)
    setIsModalOpen(true)

    // Query corresponding token balance after modal opens
    if (loadBalanceForOutcome) {
      await loadBalanceForOutcome(outcome)
    }
  }

  // Handle trade confirmation
  const handleConfirmTrade = async (_amount: string, _outcome: 'YES' | 'NO') => {
    // Parent no longer auto-closes; let modal control flow (including waiting for CLOB fill/deposit to Vault)
    setIsTransacting(true)
    try {
      // If needed, can do global refresh or tracking here
      return
    } catch (error) {
      console.error('Trade failed:', error)
    } finally {
      // Immediately restore to avoid overriding modal internal button text (like showing "Depositing...")
      setIsTransacting(false)
    }
  }

  // Format value function to make numbers look impressive
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    }
    return Math.floor(value).toString()
  }

  // Convert markets to conditions for display
  const allConditions = React.useMemo(() => {
    return markets.map(market => ({
      conditionId: market.conditionId,
      questionId: '0x' + market.slug,
      question: market.question,
      outcomeSlotCount: 2,
      resolved: market.status === MarketStatus.Resolved,
      winningOutcome: 0,
      oracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      positions: [
        {
          positionId: market.yesPositionId,
          conditionId: market.conditionId,
          questionId: '0x' + market.slug,
          outcomeIndex: 0,
          outcomeLabel: 'YES',
          balance: BigInt(0),
          balanceFormatted: '0.00',
          yieldingBalance: BigInt(0),
          yieldingBalanceFormatted: '0.00',
          idleBalance: BigInt(0),
          idleBalanceFormatted: '0.00',
          resolved: market.status === MarketStatus.Resolved,
          winningOutcome: undefined,
          isWinning: undefined,
        },
        {
          positionId: market.noPositionId,
          conditionId: market.conditionId,
          questionId: '0x' + market.slug,
          outcomeIndex: 1,
          outcomeLabel: 'NO',
          balance: BigInt(0),
          balanceFormatted: '0.00',
          yieldingBalance: BigInt(0),
          yieldingBalanceFormatted: '0.00',
          idleBalance: BigInt(0),
          idleBalanceFormatted: '0.00',
          resolved: market.status === MarketStatus.Resolved,
          winningOutcome: undefined,
          isWinning: undefined,
        }
      ],
      category: market.category,
      status: market.status,
      createdAt: new Date(market.createdAt),
      expirationDate: market.endTime ? new Date(market.endTime * 1000) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }))
  }, [markets])

  // Filter and sort conditions
  const filteredAndSortedConditions = React.useMemo(() => {
    let filtered = allConditions

    // Apply filters (for open/resolved, prefer on-chain state if available)
    if (filterBy !== 'all') {
      if (filterBy === 'open' || filterBy === 'resolved') {
        filtered = allConditions.filter(c => {
          const onchain = resolvedMap[c.conditionId]
          if (onchain === true) return filterBy === 'resolved'
          if (onchain === false) return filterBy === 'open'
          return c.status === filterBy
        })
      } else {
        filtered = allConditions.filter(c => c.category === filterBy)
      }
    }

    // Apply sorting (default: volume desc)
    const sorted = [...filtered].sort((a, b) => {
      const av = volumeMap[a.conditionId.toLowerCase()] ?? 0
      const bv = volumeMap[b.conditionId.toLowerCase()] ?? 0
      return sortDirection === 'desc' ? bv - av : av - bv
    })

    return sorted
  }, [allConditions, filterBy, sortDirection, resolvedMap, volumeMap])

  // Calculate mock APY based on total value
  const [aaveApy, setAaveApy] = React.useState<string>('—')
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resp = await fetch('/api/aave?symbol=USDC&chain=polygon', { cache: 'no-store' })
        const json = await resp.json()
        if (!cancelled) {
          const apy = typeof json?.apy === 'number' ? json.apy : null
          setAaveApy(apy !== null ? `${apy.toFixed(2)}%` : '—')
        }
      } catch {
        if (!cancelled) setAaveApy('—')
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Only show loading screen during global loading, not during individual token loading
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading your balances...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️ Error loading balances</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    )
  }

  // Always show markets interface, no longer check if conditions.length === 0

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-[#2e3b5e] dark:to-[#0f4c75] text-white rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Yield Market Status</h2>
          <div className="text-sm bg-white/10 px-3 py-1 rounded-full">
            Always 1:1 Token Ratio
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-sm opacity-90">Total Markets</div>
            <div className="text-2xl font-bold">{markets.length}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-sm opacity-90">Total Positions</div>
            <div className="text-2xl font-bold">{totalPositions}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-sm opacity-90">Total Value</div>
            <div className="text-2xl font-bold">{formatValue(totalYieldingValue)} USDC</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-sm opacity-90">Current APY (AAVE)</div>
            <div className="text-2xl font-bold">{aaveApy}</div>
          </div>
        </div>
      </div>

      {/* Markets List with Controls */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Available Markets</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredAndSortedConditions.length} of {allConditions.length} markets
          </div>
        </div>
        
        {/* Sorting and Filtering Controls */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg border border-gray-200 dark:border-[#34495e] p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Only Filter Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-[#e0e0e0]">Filter:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'open' | 'resolved')}
                className="text-sm border border-gray-300 dark:border-[#34495e] dark:bg-[#34495e] dark:text-[#e0e0e0] rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Markets</option>
                <option value="open">Open Only</option>
                <option value="resolved">Resolved Only</option>
              </select>
            </div>

            {/* Quick Filter Tags */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500 dark:text-[#a0a0a0]">Quick:</span>
              {['all', 'open', 'resolved'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterBy(filter as 'all' | 'open' | 'resolved')}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    filterBy === filter
                      ? 'bg-blue-100 dark:bg-[#0f4c75] text-blue-800 dark:text-white font-medium'
                      : 'bg-gray-100 dark:bg-[#34495e] text-gray-600 dark:text-[#e0e0e0] hover:bg-gray-200 dark:hover:bg-[#2e3b5e]'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Markets List */}
        <div className="space-y-3">
          {!statusesLoaded ? (
            // Show loading state
            <div className="space-y-3">
              {markets.map((market) => (
                <div key={market.slug} className="bg-white dark:bg-[#2e3b5e] rounded-xl border-2 dark:border-[#34495e] p-4">
                  <div className="animate-pulse">
                    <div className="flex justify-between items-center mb-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Only render actual ConditionCard after status loading is complete
            filteredAndSortedConditions.map((condition) => (
              <ConditionCard
                key={condition.conditionId}
                condition={condition}
                onTradeClick={handleTradeClick}
                preloadedResolved={resolvedMap[condition.conditionId]}
                loadingOutcome={loadingOutcome}
              />
            ))
          )}
        </div>
        
        {filteredAndSortedConditions.length === 0 && allConditions.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">No markets match your current filters</div>
            <button
              onClick={() => setFilterBy('all')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Trading Modal */}
      {selectedCondition && (
        <TradingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          marketQuestion={selectedCondition.question}
          selectedOutcome={selectedOutcome}
          currentOdds={selectedOutcome === 'YES' ? 1.85 : 2.15}
          onConfirmTrade={handleConfirmTrade}
          isTransacting={isTransacting}
          conditionId={selectedCondition.conditionId}
          positionId={selectedOutcome === 'YES'
            ? selectedCondition.positions.find(p => p.outcomeLabel === 'YES')?.positionId
            : selectedCondition.positions.find(p => p.outcomeLabel === 'NO')?.positionId
          }
        />
      )}

      {/* Wallet Connection Toast */}
      {showWalletToast && (
        <div className={`fixed top-4 right-4 z-50 transition-all duration-500 ${
          isToastFading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}>
          <div className="bg-orange-100 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-orange-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="font-medium">Please connect your wallet to trade</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}