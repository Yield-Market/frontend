'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { MarketInfo } from '@/types'
import { getAllMarkets, getDefaultMarket } from '@/lib/markets-config'

interface MarketContextType {
  markets: MarketInfo[]
  activeMarket: MarketInfo | null
  activeMarketSlug: string | null
  setActiveMarket: (marketSlug: string) => void
  isLoading: boolean
}

const MarketContext = createContext<MarketContextType | undefined>(undefined)

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [markets] = useState<MarketInfo[]>(getAllMarkets())
  const [activeMarketSlug, setActiveMarketSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize default market
  useEffect(() => {
    const defaultMarket = getDefaultMarket()
    if (defaultMarket) {
      setActiveMarketSlug(defaultMarket.slug)
    }
    setIsLoading(false)
  }, [])

  const activeMarket = activeMarketSlug
    ? markets.find(market => market.slug === activeMarketSlug) || null
    : null

  const setActiveMarket = (marketSlug: string) => {
    setActiveMarketSlug(marketSlug)
  }

  const value: MarketContextType = {
    markets,
    activeMarket,
    activeMarketSlug,
    setActiveMarket,
    isLoading,
  }

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider')
  }
  return context
}
