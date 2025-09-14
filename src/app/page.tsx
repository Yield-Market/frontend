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
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-[#e0e0e0]">
                Yield Market
              </h1>
            </div>
            <WalletDropdown />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#e0e0e0] mb-4">
            Earn While You Wait
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#a0a0a0] max-w-2xl mx-auto">
            Deposit YES/NO outcome tokens to receive yield-bearing versions and earn while you wait for market resolution.
            All tokens maintain a <span className="font-semibold text-blue-600 dark:text-[#6495ed]">1:1 ratio</span> for transparent value tracking.
          </p>
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
