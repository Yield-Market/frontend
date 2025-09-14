/**
 * CORS Proxy Utility
 * Provides unified CORS proxy request interface
 */

import { CORS_PROXY_CONFIG } from './config'

// Default CORS proxy service
const DEFAULT_PROXY_URL = 'https://cors-i1y9vf7h9-brandonxweb3-9280s-projects.vercel.app'

// Fallback CORS proxy services (currently unused but kept for future use)
// const FALLBACK_PROXY_SERVICES = [
//   'https://api.allorigins.win/raw?url=',
//   'https://cors-anywhere.herokuapp.com/',
//   'https://thingproxy.freeboard.io/fetch/',
// ]

/**
 * Build CORS proxy URL
 * @param targetUrl Target API URL
 * @returns Proxied URL
 */
export function buildProxyUrl(targetUrl: string): string {
  if (!CORS_PROXY_CONFIG.ENABLED) {
    return targetUrl
  }
  
  // Use hardcoded default proxy service
  const proxyUrl = CORS_PROXY_CONFIG.PROXY_URL || DEFAULT_PROXY_URL
  const encodedUrl = encodeURIComponent(targetUrl)
  return `${proxyUrl}/api/proxy?url=${encodedUrl}`
}

/**
 * Send request through CORS proxy
 * @param url Target URL
 * @param options Request options
 * @returns Promise<Response>
 */
export async function fetchWithProxy(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const proxyUrl = buildProxyUrl(url)
  
  // Set default request options
  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...options,
  }
  
  // Add timeout control
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CORS_PROXY_CONFIG.TIMEOUT_MS)
  
  try {
    const response = await fetch(proxyUrl, {
      ...defaultOptions,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${CORS_PROXY_CONFIG.TIMEOUT_MS}ms`)
    }
    
    throw error
  }
}

/**
 * Send JSON request through CORS proxy
 * @param url Target URL
 * @param options Request options
 * @returns Promise<T>
 */
export async function fetchJsonWithProxy<T = unknown>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithProxy(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Check if CORS proxy is available
 * @returns Promise<boolean>
 */
export async function checkProxyHealth(): Promise<boolean> {
  try {
    const testUrl = 'https://httpbin.org/get'
    const response = await fetchWithProxy(testUrl)
    return response.ok
  } catch (error) {
    console.warn('CORS proxy health check failed:', error)
    return false
  }
}

/**
 * Polymarket API specific proxy request
 * @param endpoint Polymarket API endpoint
 * @param options Request options
 * @returns Promise<Response>
 */
export async function fetchPolymarketWithProxy(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = 'https://clob.polymarket.com'
  const fullUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  
  return fetchWithProxy(fullUrl, {
    ...options,
    headers: {
      'User-Agent': 'YieldMarket/1.0',
      ...options.headers,
    },
  })
}

/**
 * Get market data through proxy
 * @param conditionId Condition ID
 * @returns Promise<any>
 */
export async function fetchMarketDataWithProxy(conditionId: string): Promise<unknown> {
  const endpoint = `/api/v1/markets?conditionId=${conditionId}`
  return fetchJsonWithProxy(`https://clob.polymarket.com${endpoint}`)
}

/**
 * Get market statistics through proxy
 * @param conditionId Condition ID
 * @returns Promise<any>
 */
export async function fetchMarketStatsWithProxy(conditionId: string): Promise<unknown> {
  const endpoint = `/api/v1/markets/${conditionId}/stats`
  return fetchJsonWithProxy(`https://clob.polymarket.com${endpoint}`)
}
