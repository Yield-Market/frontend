'use client'

import React from 'react'

interface NativeUsdcTradingModalProps {
  isOpen: boolean
  onClose: () => void
  marketQuestion: string
  selectedOutcome: 'YES' | 'NO'
  onPaymentAssetChange?: (asset: 'USDC' | 'YES_TOKEN' | 'NO_TOKEN') => void
}

export function NativeUsdcTradingModal({
  isOpen,
  onClose,
  marketQuestion,
  selectedOutcome,
  onPaymentAssetChange
}: NativeUsdcTradingModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Trade Position</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Market Info */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">Market</div>
            <div className="font-medium text-gray-900 leading-tight mb-3">{marketQuestion}</div>
          </div>

          {/* Asset Selector */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">Payment Asset</div>
            <div className="flex gap-2">
              <button
                onClick={() => onPaymentAssetChange?.(selectedOutcome === 'YES' ? 'YES_TOKEN' : 'NO_TOKEN')}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {selectedOutcome === 'YES' ? 'Y' : 'N'}
                </div>
                {selectedOutcome} Token
              </button>
              <button
                className="flex-1 px-3 py-2 border-2 border-green-500 bg-green-50 rounded-lg text-green-700 font-medium flex items-center justify-center gap-2"
                disabled
              >
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  $
                </div>
                USDC
              </button>
            </div>
          </div>

          {/* Coming Soon Content */}
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600 text-center max-w-xs">
              Native USDC trading for {selectedOutcome} positions will be available soon.
            </p>
          </div>

          {/* Placeholder Button */}
          <button
            disabled
            className="w-full mt-6 py-4 rounded-xl font-bold text-lg bg-gray-200 text-gray-500 cursor-not-allowed"
          >
            Coming Soon
          </button>

          {/* Disclaimer */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            Stay tuned for native USDC trading features.
          </div>
        </div>
      </div>
    </div>
  )
}