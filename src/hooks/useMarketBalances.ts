'use client'

import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useChainId } from 'wagmi'
import { MarketInfo, MarketCategory, MarketStatus } from '@/types'
import { getMarketConfig } from '@/lib/markets-config'
import { SafeAddressCache } from '@/lib/safe-cache'
import { logger } from '@/lib/logger'
import { getContractAddress } from '@/lib/config'

export interface PositionBalance {
  positionId: string
  conditionId: string
  questionId: string
  outcomeIndex: number
  outcomeLabel: string
  balance: bigint
  balanceFormatted: string
  // YM Vault related balances
  yieldingBalance: bigint
  yieldingBalanceFormatted: string
  idleBalance: bigint
  idleBalanceFormatted: string
  resolved: boolean
  winningOutcome?: number
  isWinning?: boolean
}

export interface ConditionInfo {
  conditionId: string
  questionId: string
  question: string
  outcomeSlotCount: number
  resolved: boolean
  winningOutcome: number
  oracle: string
  positions: PositionBalance[]
  category: MarketCategory
  status: MarketStatus
  createdAt: Date
  expirationDate: Date
}

export interface UserBalancesSummary {
  totalPositions: number
  totalValue: string
  conditions: ConditionInfo[]
  loading: boolean
  error?: string
  loadBalanceForOutcome?: (outcome: 'YES' | 'NO') => Promise<void>
  loadingOutcome?: 'YES' | 'NO' | null // New: currently loading token type
}

export function useMarketBalances(marketId?: string): UserBalancesSummary {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const [conditions, setConditions] = useState<ConditionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingOutcome, setLoadingOutcome] = useState<'YES' | 'NO' | null>(null)
  const [error, setError] = useState<string>()

  // Get market config
  const marketConfig = marketId ? getMarketConfig(marketId) : null

  // Create condition info from market config
  const createConditionFromMarket = (market: MarketInfo): ConditionInfo => {
    const positions: PositionBalance[] = [
      {
        positionId: market.yesPositionId,
        conditionId: market.conditionId,
        questionId: '0x' + market.slug, // Use market slug as question ID for now
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
    ]

    return {
      conditionId: market.conditionId,
      questionId: '0x' + market.slug,
      question: market.question,
      outcomeSlotCount: 2,
      resolved: market.status === MarketStatus.Resolved,
      winningOutcome: 0, // Default to 0, will be updated when resolved
      oracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Default oracle
      positions,
      category: market.category,
      status: market.status,
      createdAt: new Date(market.createdAt),
      expirationDate: market.endTime ? new Date(market.endTime * 1000) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }
  }

  // Use cached version of Safe query
  async function fetchSafesForOwner(owner?: string): Promise<string[]> {
    if (!owner) return []
    return SafeAddressCache.getSafesForOwner(owner, chainId)
  }

  // Helper: read best holder balance across EOA and Safes for a given ERC1155 positionId
  async function readBestPositionBalance(positionId: string): Promise<{ holder?: string; balance: bigint }> {
    try {
      // ConditionalTokens address on current chain
      const ctfAddress = getContractAddress(chainId || 137, 'CONDITIONAL_TOKENS')
      if (!publicClient || !positionId) return { balance: 0n }
      const holders: string[] = [address || '', ...await fetchSafesForOwner(address)]
        .filter(Boolean)
      let best: { holder?: string; balance: bigint } = { balance: 0n }
      for (const h of holders) {
        try {
          const bal = await publicClient.readContract({
            address: ctfAddress as `0x${string}`,
            abi: [
              { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [ { name: 'account', type: 'address' }, { name: 'id', type: 'uint256' } ], outputs: [ { name: '', type: 'uint256' } ] }
            ],
            functionName: 'balanceOf',
            args: [h as `0x${string}`, BigInt(positionId)]
          }) as unknown as bigint
          logger.balance('BalanceOf query', { holder: h, positionId, balance: bal.toString() })
          if (bal > best.balance) best = { holder: h, balance: bal }
        } catch {}
      }
      logger.balance('BestBalance result', { positionId, bestHolder: best.holder, balance: best.balance.toString() })
      return best
    } catch {
      return { balance: 0n }
    }
  }

  // Function to query balance on demand
  const loadBalanceForOutcome = async (outcome: 'YES' | 'NO') => {
    if (!isConnected || !address || !marketConfig || !publicClient) {
      return
    }

    setLoadingOutcome(outcome) // Set currently loading token type
    setError(undefined)

    try {
      const condition = createConditionFromMarket(marketConfig)
      const targetPosition = condition.positions.find(p => p.outcomeLabel === outcome)!

      // Only query the token type the user clicked
      const bestBalance = await readBestPositionBalance(targetPosition.positionId)

      const toDisplay = (bal: bigint) => (Number(bal) / 1e6).toFixed(2)
      // Update balance for corresponding position
      setConditions(prevConditions => {
        return prevConditions.map(cond => {
          if (cond.conditionId === condition.conditionId) {
            return {
              ...cond,
              positions: cond.positions.map(pos => {
                if (pos.outcomeLabel === outcome) {
                  return {
                    ...pos,
                    balance: bestBalance.balance,
                    balanceFormatted: toDisplay(bestBalance.balance),
                    yieldingBalance: 0n,
                    yieldingBalanceFormatted: '0.00',
                    idleBalance: bestBalance.balance,
                    idleBalanceFormatted: toDisplay(bestBalance.balance),
                  }
                }
                return pos
              })
            }
          }
          return cond
        })
      })
    } catch (err) {
      logger.error(`Error loading ${outcome} balance:`, err)
      setError(`Failed to load ${outcome} balance`)
    } finally {
      setLoadingOutcome(null) // Clear loading state
    }
  }

  // No longer auto-load balances, only query when needed
  // Initialize with basic market info only, don't query balances
  useEffect(() => {
    if (!marketConfig) {
      setConditions([])
      setLoading(false)
      return
    }

    // Only create basic market info, don't query balances
    const condition = createConditionFromMarket(marketConfig)
    setConditions([condition])
    setLoading(false)
  }, [marketConfig])

  // Calculate totals
  const totalPositions = conditions.reduce((sum, condition) => 
    sum + condition.positions.length, 0
  )
  
  const totalValue = conditions.reduce((sum, condition) => {
    const conditionValue = condition.positions.reduce((posSum, position) => {
      return posSum + parseFloat(position.balanceFormatted) + parseFloat(position.yieldingBalanceFormatted)
    }, 0)
    return sum + conditionValue
  }, 0)

  return {
    totalPositions,
    totalValue: totalValue.toFixed(2),
    conditions,
    loading,
    loadingOutcome, // New: currently loading token type
    error,
    loadBalanceForOutcome, // New: function to query balance on demand
  }
}
