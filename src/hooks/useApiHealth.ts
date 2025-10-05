/**
 * API Health Check Hook
 * Checks the health status of backend API endpoints
 */

import { useState, useEffect, useCallback } from 'react'
import { API_CONFIG } from '@/lib/config'

export interface HealthCheckResult {
  isHealthy: boolean
  status: number
  responseTime: number
  error?: string
  lastChecked: Date
}

export interface UseApiHealthOptions {
  /**
   * Whether to automatically start health checking
   */
  autoStart?: boolean
  
  /**
   * Check interval in milliseconds
   */
  interval?: number
  
  /**
   * API endpoint to check
   */
  endpoint?: string
  
  /**
   * Request timeout in milliseconds
   */
  timeout?: number
}

const DEFAULT_OPTIONS: Required<UseApiHealthOptions> = {
  autoStart: true,
  interval: 30000, // Check every 30 seconds
  endpoint: '/markets', // Check markets endpoint
  timeout: 10000, // 10 second timeout
}

export function useApiHealth(options: UseApiHealthOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = useCallback(async (): Promise<HealthCheckResult> => {
    const startTime = Date.now()
    
    try {
      setIsChecking(true)
      
      // Build complete API URL
      const baseUrl = API_CONFIG.BASE_URL
      const version = API_CONFIG.VERSION
      const fullUrl = `${baseUrl}/api/${version}${config.endpoint}`
      
      console.log('🔍 Checking API health:', fullUrl)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      const result: HealthCheckResult = {
        isHealthy: response.ok,
        status: response.status,
        responseTime,
        lastChecked: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      }
      
      console.log('✅ API health check result:', result)
      return result
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      let errorMessage = 'Unknown error'
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Request timeout after ${config.timeout}ms`
        } else {
          errorMessage = error.message
        }
      }
      
      const result: HealthCheckResult = {
        isHealthy: false,
        status: 0,
        responseTime,
        lastChecked: new Date(),
        error: errorMessage,
      }
      
      console.error('❌ API health check failed:', result)
      return result
    } finally {
      setIsChecking(false)
    }
  }, [config.endpoint, config.timeout])

  const performHealthCheck = useCallback(async () => {
    const result = await checkHealth()
    setHealthResult(result)
    return result
  }, [checkHealth])

  // Automatic health checking
  useEffect(() => {
    if (!config.autoStart) return

    // Perform initial check immediately
    performHealthCheck()

    // Set up interval for periodic checks
    const intervalId = setInterval(performHealthCheck, config.interval)

    return () => {
      clearInterval(intervalId)
    }
  }, [config.autoStart, config.interval, performHealthCheck])

  return {
    /**
     * Health check result data
     */
    healthResult,
    
    /**
     * Whether a health check is currently in progress
     */
    isChecking,
    
    /**
     * Manually trigger a health check
     */
    checkHealth: performHealthCheck,
    
    /**
     * Quick access to health status
     */
    isHealthy: healthResult?.isHealthy ?? null,
    
    /**
     * Quick access to error message
     */
    error: healthResult?.error,
    
    /**
     * Quick access to response time
     */
    responseTime: healthResult?.responseTime,
    
    /**
     * Quick access to HTTP status code
     */
    status: healthResult?.status,
  }
}