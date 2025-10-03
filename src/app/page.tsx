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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
