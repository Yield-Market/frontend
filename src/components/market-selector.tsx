'use client'

import React, { useState } from 'react'
import { MarketInfo, MarketCategory } from '@/types'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface MarketSelectorProps {
  markets: MarketInfo[]
  activeMarketSlug?: string
  onMarketSelect: (marketSlug: string) => void
  className?: string
}

export function MarketSelector({
  markets,
  activeMarketSlug,
  onMarketSelect,
  className = ''
}: MarketSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all')

  const activeMarket = markets.find(market => market.slug === activeMarketSlug)
  
  const filteredMarkets = selectedCategory === 'all' 
    ? markets 
    : markets.filter(market => market.category === selectedCategory)

  const categories = ['all', ...Object.values(MarketCategory)] as const

  const getCategoryIcon = (category: MarketCategory) => {
    switch (category) {
      case MarketCategory.Crypto:
        return '₿'
      case MarketCategory.Political:
        return '🏛️'
      case MarketCategory.Sports:
        return '⚽'
      case MarketCategory.Weather:
        return '🌤️'
      case MarketCategory.Economics:
        return '📈'
      case MarketCategory.Technology:
        return '💻'
      default:
        return '📊'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-green-600 bg-green-100'
      case 'resolved':
        return 'text-blue-600 bg-blue-100'
      case 'expired':
        return 'text-gray-600 bg-gray-100'
      case 'paused':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {activeMarket ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getCategoryIcon(activeMarket.category)}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {activeMarket.question}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activeMarket.status)}`}>
                    {activeMarket.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {activeMarket.category}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Select a market...</span>
            )}
          </div>
          {isOpen ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Category filter */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All' : (
                    <>
                      <span className="mr-1">{getCategoryIcon(category as MarketCategory)}</span>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Market list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredMarkets.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No markets found
              </div>
            ) : (
              filteredMarkets.map((market) => (
                <button
                  key={market.slug}
                  onClick={() => {
                    onMarketSelect(market.slug)
                    setIsOpen(false)
                  }}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    market.slug === activeMarketSlug ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getCategoryIcon(market.category)}</span>
                        <span className="text-sm font-medium text-gray-900 line-clamp-2">
                          {market.question}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(market.status)}`}>
                          {market.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {market.category}
                        </span>
                        {market.endTime && (
                          <span className="text-xs text-gray-500">
                            Ends: {new Date(market.endTime * 1000).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {market.slug === activeMarketSlug && (
                      <div className="ml-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
