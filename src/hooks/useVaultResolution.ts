'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useWatchContractEvent } from 'wagmi'
import { YM_VAULT_ABI, CONDITIONAL_TOKENS_ABI } from '@/lib/abis'
import { getAllMarkets } from '@/lib/markets-config'

export interface VaultResolutionState {
  isResolved: boolean
  yesWon?: boolean
  finalPayoutRatio?: bigint
  vaultAddress?: `0x${string}`
  loading: boolean
}

export function useVaultResolution(conditionId?: string): VaultResolutionState {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const markets = getAllMarkets()
  const marketCfg = useMemo(() => {
    if (!conditionId) return undefined
    return markets.find(m => m.conditionId?.toLowerCase?.() === conditionId.toLowerCase())
  }, [markets, conditionId])

  const vaultAddress = marketCfg?.ymVaultAddress as `0x${string}` | undefined
  const ctfAddress = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"

  // Query payoutDenominator from ConditionalTokens to check if resolved
  const { data: payoutDenominator, refetch: refetchResolution } = useReadContract({
    address: ctfAddress as `0x${string}`,
    abi: CONDITIONAL_TOKENS_ABI,
    functionName: 'payoutDenominator',
    args: [conditionId as `0x${string}`],
    query: { 
      enabled: !!ctfAddress && !!conditionId,
      refetchInterval: false,
    }
  })

  // Query payoutNumerators from ConditionalTokens to get specific results
  const { data: payoutNumerators } = useReadContract({
    address: ctfAddress as `0x${string}`,
    abi: CONDITIONAL_TOKENS_ABI,
    functionName: 'payoutNumerators',
    args: [conditionId as `0x${string}`, BigInt(0)], // Query first result (YES)
    query: { 
      enabled: !!ctfAddress && !!conditionId && !!payoutDenominator && payoutDenominator > 0,
      refetchInterval: false,
    }
  })

  // Parse condition data
  const isResolved = payoutDenominator !== undefined && payoutDenominator > 0
  const yesWon = isResolved && payoutNumerators !== undefined ? payoutNumerators > 0 : undefined

  // Query final payout ratio from YMVault (if needed)
  const { data: finalPayoutRatio } = useReadContract({
    address: vaultAddress,
    abi: YM_VAULT_ABI,
    functionName: 'finalPayoutRatio',
    query: { enabled: !!vaultAddress && isResolved }
  })

  // Subscribe to ConditionResolution event from ConditionalTokens
  useWatchContractEvent({
    address: ctfAddress as `0x${string}`,
    abi: CONDITIONAL_TOKENS_ABI,
    eventName: 'ConditionResolution',
    args: {
      conditionId: conditionId as `0x${string}`
    },
    enabled: !!ctfAddress && !!conditionId,
    onLogs: async (logs) => {
      if (!conditionId) return
      
      console.log('ConditionResolution event detected:', logs)
      
      // Parse results directly from event data
      const eventLog = logs[0]
      if (eventLog?.args) {
        const { payoutNumerators } = eventLog.args as { payoutNumerators: bigint[] }
        console.log('Payout numerators from event:', payoutNumerators)
        
        // Check which result won
        if (payoutNumerators && payoutNumerators.length === 2) {
          const yesWins = payoutNumerators[0] > 0n
          const noWins = payoutNumerators[1] > 0n
          console.log('Event analysis: YES wins:', yesWins, 'NO wins:', noWins)
        }
      }
      
      // Refresh condition state after listening to condition resolution event
      try {
        await refetchResolution()
        setRefreshTrigger(prev => prev + 1) // Force re-render
        console.log('Condition resolution state refreshed after ConditionResolution event')
      } catch (e) {
        console.error('Failed to refresh condition resolution state:', e)
      }
    }
  })

  // Check state once on page load to ensure data is up to date
  useEffect(() => {
    if (!ctfAddress || !conditionId) return
    
    // Force refresh state once on initialization
    const checkInitialState = async () => {
      try {
        await refetchResolution()
        setRefreshTrigger(prev => prev + 1) // Force re-render
        console.log('[VaultResolution] Initial state check completed for:', conditionId)
      } catch (e) {
        console.error('[VaultResolution] Failed to check initial state:', e)
      }
    }
    
    checkInitialState()
  }, [ctfAddress, conditionId, refetchResolution])

  // Debug log for the given condition
  useEffect(() => {
    if (!vaultAddress) return
    console.log('[VaultResolution]', {
      conditionId,
      vaultAddress,
      refreshTrigger,
      payoutDenominator: payoutDenominator?.toString(),
      payoutNumerators: payoutNumerators?.toString(),
      isResolved: Boolean(isResolved),
      yesWon,
      finalPayoutRatio: finalPayoutRatio?.toString()
    })
  }, [conditionId, vaultAddress, refreshTrigger, payoutDenominator, payoutNumerators, isResolved, yesWon, finalPayoutRatio])

  return {
    isResolved: Boolean(isResolved),
    yesWon: yesWon as boolean | undefined,
    finalPayoutRatio: finalPayoutRatio as bigint | undefined,
    vaultAddress,
    loading: !vaultAddress,
  }
}


