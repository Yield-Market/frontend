'use client'

import { useRef } from 'react'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { UserBalancesOverview } from '@/components/user-balances-overview'
import { Footer } from '@/components/footer'
import { MarketProvider, useMarket } from '@/contexts/market-context'

function MarketContent() {
  const { } = useMarket()
  const addFilterRef = useRef<((category: string) => void) | null>(null)

  const handlePolymarketUserClick = () => {
    if (addFilterRef.current) {
      addFilterRef.current('Polymarket Portfolio')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#1a1a2e] dark:to-[#16213e] flex flex-col">
      {/* Header with Wallet Dropdown */}
      <header className="bg-white/80 dark:bg-[#16213e]/90 backdrop-blur-sm border-b border-gray-200 dark:border-[#34495e] sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex justify-between items-center">
            <div className="flex-1"></div>
            <div className="flex-2 flex justify-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-[#6495ed] dark:to-[#87ceeb] bg-clip-text text-transparent whitespace-nowrap">
                Predict and Yield In Yield Market
              </h1>
            </div>
            <div className="flex-1 flex justify-end items-center">
              <WalletDropdown />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Portfolio with Integrated Deposit/Withdraw */}
          <UserBalancesOverview onAddFilterRef={addFilterRef} />
          
          {/* Polymarket User Link */}
          <div className="text-center">
            <button 
              onClick={handlePolymarketUserClick}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer"
            >
              <span>I&apos;m a polymarket user</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default function Home() {
  return (
    <MarketProvider>
      <MarketContent />
    </MarketProvider>
  )
}
