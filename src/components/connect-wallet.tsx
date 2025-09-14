'use client'

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { Button } from '@/components/ui/button'
import { NETWORK_CONFIG, getChainName } from '@/lib/config'

const SUPPORTED_CHAINS = NETWORK_CONFIG.SUPPORTED_CHAINS

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()

  const isWrongNetwork = isConnected && !SUPPORTED_CHAINS.includes(chainId)

  if (isConnected && address) {
    return (
      <div className="bg-white rounded-xl shadow-lg border p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Wallet Connected</h3>
            <p className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded-md mt-2">
              {address.slice(0, 8)}...{address.slice(-6)}
            </p>
          </div>

          <div className="p-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 text-center">
              Network: {getChainName(chainId)}
            </div>
            {isWrongNetwork && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  Unsupported network. Please switch to a supported network in your wallet.
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={() => disconnect()}
            variant="outline"
            className="w-full"
          >
            Disconnect Wallet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border p-8 max-w-md mx-auto text-center">
      <div className="space-y-6">
        <div>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 text-sm">
            Connect your wallet to start depositing tokens and earning yield
          </p>
        </div>

        <div className="space-y-3">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isPending}
              variant="default"
              className="w-full h-12 text-base font-medium"
            >
              <span className="flex items-center justify-center gap-3">
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <span>Connect {connector.name}</span>
                  </>
                )}
              </span>
            </Button>
          ))}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>Supported Networks:</p>
          <p>• Polygon Mainnet • Polygon Amoy • Localhost</p>
        </div>
      </div>
    </div>
  )
}