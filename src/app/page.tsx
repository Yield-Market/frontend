'use client'

import { WalletDropdown } from '@/components/wallet-dropdown'
import { UserBalancesOverview } from '@/components/user-balances-overview'
import { MarketProvider, useMarket } from '@/contexts/market-context'

function MarketContent() {
  const { } = useMarket()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#1a1a2e] dark:to-[#16213e]">
      {/* Header with Wallet Dropdown */}
      <header className="bg-white/80 dark:bg-[#16213e]/90 backdrop-blur-sm border-b border-gray-200 dark:border-[#34495e] sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="w-1/4">
              {/* Left side - can be used for logo or other elements */}
            </div>
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-[#6495ed] dark:to-[#87ceeb] bg-clip-text text-transparent whitespace-nowrap">
                Predict and Yield In Yield Market
              </h1>
            </div>
            <div className="w-1/4 flex justify-end">
              <WalletDropdown />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search markets..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-[#34495e] rounded-lg bg-white dark:bg-[#16213e] text-gray-900 dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-[#6495ed] dark:focus:border-[#6495ed] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Portfolio with Integrated Deposit/Withdraw */}
          <UserBalancesOverview />
        </div>
      </div>
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
