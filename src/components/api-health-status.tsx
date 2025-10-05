/**
 * API Health Status Component
 * Displays the current health status of the backend API
 */

'use client'

import { useApiHealth } from '@/hooks/useApiHealth'
import { useState } from 'react'

interface ApiHealthStatusProps {
  /**
   * Whether to show detailed information
   */
  showDetails?: boolean
  
  /**
   * Custom CSS class name
   */
  className?: string
  
  /**
   * Whether to show in compact mode
   */
  compact?: boolean
}

export function ApiHealthStatus({ 
  showDetails = false, 
  className = '',
  compact = false 
}: ApiHealthStatusProps) {
  const [showDetailedInfo, setShowDetailedInfo] = useState(showDetails)
  const { healthResult, isChecking, isHealthy, checkHealth } = useApiHealth({
    autoStart: true,
    interval: 30000, // Check every 30 seconds
    endpoint: '/markets',
    timeout: 10000,
  })

  const getStatusColor = () => {
    if (isChecking) return 'text-yellow-500'
    if (isHealthy === true) return 'text-green-500'
    if (isHealthy === false) return 'text-red-500'
    return 'text-gray-500'
  }

  const getStatusIcon = () => {
    if (isChecking) return '🔄'
    if (isHealthy === true) return '✅'
    if (isHealthy === false) return '❌'
    return '⚪'
  }

  const getStatusText = () => {
    if (isChecking) return 'Checking...'
    if (isHealthy === true) return 'API Online'
    if (isHealthy === false) return 'API Offline'
    return 'Unknown'
  }

  const handleStatusClick = () => {
    if (compact) {
      setShowDetailedInfo(!showDetailedInfo)
    } else {
      checkHealth()
    }
  }

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleStatusClick}
          className={`flex items-center space-x-1 text-xs ${getStatusColor()} hover:opacity-75 transition-opacity`}
          title={`Backend API Status: ${getStatusText()}`}
        >
          <span className={isChecking ? 'animate-spin' : ''}>{getStatusIcon()}</span>
          <span>{getStatusText()}</span>
        </button>
        
        {showDetailedInfo && healthResult && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 min-w-48">
            <div className="space-y-1">
              <div>Status: {healthResult.status}</div>
              <div>Response: {healthResult.responseTime}ms</div>
              <div>Last Check: {healthResult.lastChecked.toLocaleTimeString()}</div>
              {healthResult.error && (
                <div className="text-red-300">Error: {healthResult.error}</div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={isChecking ? 'animate-spin' : ''}>{getStatusIcon()}</span>
          <span className={`font-medium ${getStatusColor()}`}>
            Backend API Status: {getStatusText()}
          </span>
        </div>
        
        <button
          onClick={() => checkHealth()}
          disabled={isChecking}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check Now'}
        </button>
      </div>

      {showDetails && healthResult && (
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">HTTP Status:</span> {healthResult.status}
            </div>
            <div>
              <span className="font-medium">Response Time:</span> {healthResult.responseTime}ms
            </div>
            <div>
              <span className="font-medium">Last Checked:</span> {healthResult.lastChecked.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Endpoint:</span> /api/v1/markets
            </div>
          </div>
          
          {healthResult.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <span className="font-medium text-red-700">Error:</span>
              <span className="text-red-600 ml-1">{healthResult.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ApiHealthStatus