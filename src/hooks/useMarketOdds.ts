'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { useState, useEffect } from 'react'
import { YM_VAULT_ABI } from '@/lib/abis'
// contracts.ts removed; addresses are sourced from markets-config.ts
import { getAllMarkets } from '@/lib/markets-config'

interface MarketOdds {
  yesOdds: number
  noOdds: number
  yesPrice: number
  noPrice: number
  loading: boolean
  error?: string
}

export function useMarketOdds(conditionId?: string): MarketOdds {
  // Cache for previous data
  const [cachedData, setCachedData] = useState<{
    yesOdds: number
    noOdds: number
    yesPrice: number
    noPrice: number
  }>({
    yesOdds: 1.0,
    noOdds: 1.0,
    yesPrice: 0.5,
    noPrice: 0.5
  })
  // const chainId = useChainId() // Removed unused
  
  // Get contract addresses
  // const targetChainId = chainId || 31337 // Use 31337 as default for local development
  // Read from markets-config instead of global vault
  const marketFromCfg = getAllMarkets().find(m => m.conditionId?.toLowerCase?.() === (conditionId || '').toLowerCase())
  const ymVaultAddress = marketFromCfg?.ymVaultAddress || '0x0000000000000000000000000000000000000000'

  // Query total deposits from YM Vault
  const { data: totalYesDeposits, error: yesError, isLoading: yesLoading } = useReadContract({
    address: ymVaultAddress as `0x${string}`,
    abi: YM_VAULT_ABI,
    functionName: 'totalYesDeposits',
    query: { enabled: !!ymVaultAddress }
  })

  const { data: totalNoDeposits, error: noError, isLoading: noLoading } = useReadContract({
    address: ymVaultAddress as `0x${string}`,
    abi: YM_VAULT_ABI,
    functionName: 'totalNoDeposits',
    query: { enabled: !!ymVaultAddress }
  })

  const loading = yesLoading || noLoading
  const error = yesError?.message || noError?.message


  // Calculate odds and prices based on actual deposits
  let yesOdds = cachedData.yesOdds
  let noOdds = cachedData.noOdds
  let yesPrice = cachedData.yesPrice
  let noPrice = cachedData.noPrice

  // For testing, use mock data if no real data is available
  if (!totalYesDeposits || !totalNoDeposits || loading) {
    // Use cached data if available, otherwise use mock data
    if (cachedData.yesOdds === 1.0 && cachedData.noOdds === 1.0) {
      yesPrice = 0.6  // 60% probability for YES
      noPrice = 0.4   // 40% probability for NO
      yesOdds = 1 / yesPrice // 1.67x
      noOdds = 1 / noPrice   // 2.5x
    }
  } else {
    const yesDeposits = parseFloat(formatUnits(totalYesDeposits, 6)) // Assuming 6 decimals for USDC
    const noDeposits = parseFloat(formatUnits(totalNoDeposits, 6))
    const totalDeposits = yesDeposits + noDeposits


    if (totalDeposits > 0) {
      // Calculate prices based on deposit ratios
      // More deposits on one side = lower odds for that side
      yesPrice = noDeposits / totalDeposits
      noPrice = yesDeposits / totalDeposits

      // Calculate odds (1 / price)
      yesOdds = yesPrice > 0 ? 1 / yesPrice : 1.0
      noOdds = noPrice > 0 ? 1 / noPrice : 1.0
    }
  }

  // Update cache when we have new data
  useEffect(() => {
    if (!loading && (yesOdds !== 1.0 || noOdds !== 1.0)) {
      setCachedData({
        yesOdds: Math.round(yesOdds * 100) / 100,
        noOdds: Math.round(noOdds * 100) / 100,
        yesPrice: Math.round(yesPrice * 100) / 100,
        noPrice: Math.round(noPrice * 100) / 100
      })
    }
  }, [loading, yesOdds, noOdds, yesPrice, noPrice])

  return {
    yesOdds: Math.round(yesOdds * 100) / 100, // Round to 2 decimal places
    noOdds: Math.round(noOdds * 100) / 100,
    yesPrice: Math.round(yesPrice * 100) / 100,
    noPrice: Math.round(noPrice * 100) / 100,
    loading,
    error
  }
}
