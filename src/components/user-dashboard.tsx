'use client'

import { useAccount } from 'wagmi'
import { useMarketBalances } from '@/hooks/useMarketBalances'
import { useUserData } from '@/hooks/useUserData'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MarketCategory } from '@/types'

interface UserDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function UserDashboard({ isOpen, onClose }: UserDashboardProps) {
  const { address } = useAccount()
  const balances = useMarketBalances()
  const { userInfo, userPositions, loading, error, refetch } = useUserData()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatCurrency = (value: string | undefined) => {
    if (!value || value === '0') return '$0.00'
    const num = parseFloat(value)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Dashboard Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-all duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Investment Dashboard
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          {address && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Wallet: <span className="font-mono">{formatAddress(address)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading your data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Portfolio Overview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Portfolio Overview
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(balances.totalValue)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Value</p>
                  </div>
                  
                  <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {balances.totalPositions || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Positions</p>
                  </div>
                </div>
              </div>

              {/* User Stats */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account Details
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Markets Participated</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {userInfo?.markets || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Polymarket User</span>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      userInfo?.polymarketUser 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    )}>
                      {userInfo?.polymarketUser ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {userPositions?.items && userPositions.items.length > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400">External Positions</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {userPositions.items.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Positions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Active Positions
                </h3>
                
                {balances.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading positions...</p>
                    </div>
                  </div>
                ) : balances.conditions && balances.conditions.length > 0 ? (
                  <div className="space-y-3">
                    {balances.conditions.slice(0, 5).map((condition) => (
                      <div 
                        key={condition.conditionId}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                          {condition.question}
                        </h4>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                            condition.category === MarketCategory.Political 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                              : condition.category === MarketCategory.Crypto 
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                          )}>
                            {condition.category}
                          </span>
                          
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                            condition.resolved 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          )}>
                            {condition.resolved ? 'Resolved' : 'Active'}
                          </span>
                        </div>

                        {condition.positions.length > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {condition.positions.length} position{condition.positions.length !== 1 ? 's' : ''}
                            {condition.positions.some(p => parseFloat(p.balanceFormatted) > 0) && (
                              <span className="ml-2 text-green-600 dark:text-green-400">
                                • Active
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {balances.conditions.length > 5 && (
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          +{balances.conditions.length - 5} more positions
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Active Positions
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto">
                      Start investing in prediction markets to see your positions here.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200" 
                  onClick={() => window.location.href = '/'}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explore Markets
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full transition-colors duration-200" 
                  onClick={refetch}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}