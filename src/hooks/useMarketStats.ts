'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { useState, useEffect } from 'react'
import { YM_VAULT_ABI } from '@/lib/abis'
// contracts.ts removed; addresses are sourced from markets-config.ts
import { getAllMarkets } from '@/lib/markets-config'

interface MarketStats {
  volume: number      // Placeholder: returns yielding (real volume calculated by idle+yielding in component)
  yielding: number    // totalMatched value from YM contract
  idle: number        // Placeholder: provided by component from Polymarket API and overridden
  loading: boolean
  error?: string
}

export function useMarketStats(conditionId?: string): MarketStats {
  // Cache for previous data
  const [cachedData, setCachedData] = useState<{
    volume: number
    yielding: number
    idle: number
  }>({ volume: 0, yielding: 0, idle: 0 })
  // const chainId = useChainId() // Removed unused
  
  // Get contract addresses
  // const targetChainId = chainId || 31337 // Use 31337 as default for local development
  // Read from markets-config instead of global vault
  const marketFromCfg = getAllMarkets().find(m => m.conditionId?.toLowerCase?.() === (conditionId || '').toLowerCase())
  const ymVaultAddress = marketFromCfg?.ymVaultAddress || '0x0000000000000000000000000000000000000000'

  // Query YM Vault totalMatched (actual matched USDC amount)
  const { data: totalMatched, error: matchedError, isLoading: matchedLoading } = useReadContract({
    address: ymVaultAddress as `0x${string}`,
    abi: YM_VAULT_ABI,
    functionName: 'totalMatched',
    query: { enabled: !!ymVaultAddress }
  })

  const loading = matchedLoading
  const error = matchedError?.message

  // Calculate stats
  let volume = cachedData.volume
  let yielding = cachedData.yielding
  let idle = cachedData.idle


  // When loading or no on-chain data yet, use cached values
  if (!totalMatched || loading) {
    // Use cached data if available, otherwise use mock data
    yielding = cachedData.yielding
    idle = cachedData.idle
    volume = cachedData.volume
  } else {
    // yielding uses contract totalMatched
    yielding = parseFloat(formatUnits(totalMatched, 6))
    // idle provided by component from Polymarket API, keep previous value here
    idle = cachedData.idle
    // volume returns yielding for now (actual display calculated by component as idle+yielding)
    volume = idle + yielding
  }

  // Update cache when we have new data
  useEffect(() => {
    if (!loading) {
      setCachedData({
        volume: Math.round(volume * 100) / 100,
        yielding: Math.round(yielding * 100) / 100,
        idle: Math.round(idle * 100) / 100
      })
    }
  }, [loading, volume, yielding, idle])

  return {
    volume: Math.round(volume * 100) / 100,
    yielding: Math.round(yielding * 100) / 100,
    idle: Math.round(idle * 100) / 100,
    loading,
    error
  }
}
