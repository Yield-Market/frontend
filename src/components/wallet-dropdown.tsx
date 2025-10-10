'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { UserDashboard } from '@/components/user-dashboard'

export function WalletDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [connectionError, setConnectionError] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Find MetaMask connector and make it first in the list
  const metaMaskConnector = connectors.find(c => c.name && c.name.toLowerCase().includes('metamask'))
  const otherConnectors = connectors.filter(c => !c.name || !c.name.toLowerCase().includes('metamask'))
  const orderedConnectors = metaMaskConnector ? [metaMaskConnector, ...otherConnectors] : connectors

  const handleConnectorClick = async (connector: ReturnType<typeof useConnect>['connectors'][0]) => {
    try {
      setConnectionError('')
      await connect({ connector })
      setIsOpen(false)
    } catch (err) {
      logger.error('Connection failed:', err)
      setConnectionError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  // Main component render
  if (!mounted) {
    return (
      <>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-white hover:bg-gray-50"
        >
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="font-mono text-sm">Loading...</span>
        </Button>
        
        <UserDashboard 
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
        />
      </>
    )
  }

  if (isConnected && address) {
    return (
      <>
        <div className="relative">
          <Button
            onClick={() => setIsDashboardOpen(true)}
            variant="outline"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 dark:bg-[#34495e] dark:hover:bg-[#2e3b5e] dark:border-[#34495e] dark:text-[#e0e0e0] leading-none"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-mono text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </Button>
        </div>

        <UserDashboard 
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="default"
          className="flex items-center gap-2"
        >
          <span>Connect Wallet</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#16213e] rounded-xl shadow-lg border dark:border-[#34495e] z-50">
            {/* Arrow pointer */}
            <div className="absolute -top-2 right-6 w-3 h-3 bg-white dark:bg-[#16213e] border border-gray-200 dark:border-[#34495e] rotate-45" />
            <div className="p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-[#e0e0e0] text-center">
                  Connect a wallet
                </h3>

                <div className="space-y-2">
                  {orderedConnectors.map((connector, index) => (
                    <Button
                      key={connector.uid}
                      onClick={() => handleConnectorClick(connector)}
                      disabled={isPending}
                      variant={index === 0 ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start text-sm"
                    >
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{connector.name}</span>
                          {index === 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Error display */}
                {(connectionError || error) && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {connectionError || error?.message || 'Connection failed'}
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-[#a0a0a0] text-center space-y-1 pt-2 border-t dark:border-[#34495e]">
                  <p>Supported Networks:</p>
                  <p>Polygon • Amoy • Localhost</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay to close dropdown when clicking outside */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      <UserDashboard 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />
    </>
  )
}