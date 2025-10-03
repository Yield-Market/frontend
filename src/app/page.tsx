'use client'

import { WalletDropdown } from '@/components/wallet-dropdown'
import { UserBalancesOverview } from '@/components/user-balances-overview'
import { MarketProvider, useMarket } from '@/contexts/market-context'
import { useState } from 'react'

function MarketContent() {
  const { } = useMarket()
  const [activeFilters, setActiveFilters] = useState<string[]>(['Open'])

  const addFilter = (category: string) => {
    if (!activeFilters.includes(category) && activeFilters.length < 5) {
      setActiveFilters([...activeFilters, category])
    }
  }

  const removeFilter = (category: string) => {
    // Don't allow removing the core filters, just replace them
    if (['Open', 'Close', 'Trending'].includes(category)) {
      setActiveFilters(activeFilters.filter(f => !['Open', 'Close', 'Trending'].includes(f)).concat([category]))
    } else {
      setActiveFilters(activeFilters.filter(f => f !== category))
    }
  }

  const clearFilters = () => {
    setActiveFilters(['Open'])
  }

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
        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-4">
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
            
            {/* Category Labels */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Categories:</span>
              
              {/* Core Status Categories - Always Present */}
              <button 
                onClick={() => addFilter('Open')}
                className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium"
              >
                Open
              </button>
              <button 
                onClick={() => addFilter('Close')}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
              >
                Close
              </button>
              <button 
                onClick={() => addFilter('Trending')}
                className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-medium"
              >
                Trending
              </button>
              
              {/* Divider */}
              <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
              
              {/* Additional Topic Categories */}
              <button 
                onClick={() => addFilter('Sports')}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Sports
              </button>
              <button 
                onClick={() => addFilter('Politics')}
                className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                Politics
              </button>
              <button 
                onClick={() => addFilter('Technology')}
                className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
              >
                Technology
              </button>
              <button 
                onClick={() => addFilter('Economics')}
                className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
              >
                Economics
              </button>
              <button 
                onClick={() => addFilter('Entertainment')}
                className="px-3 py-1 text-sm bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
              >
                Entertainment
              </button>
            </div>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Active Filters:</span>
                {activeFilters.map((filter) => (
                  <div
                    key={filter}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-full"
                  >
                    <span>{filter}</span>
                    <button
                      onClick={() => removeFilter(filter)}
                      className="ml-1 hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${filter} filter`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Portfolio with Integrated Deposit/Withdraw */}
          <UserBalancesOverview activeFilters={activeFilters} onClearFilters={clearFilters} />
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
