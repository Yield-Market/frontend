// Safe address cache utility
// Used to cache user's Safe wallet addresses, reducing duplicate queries

interface SafeCache {
  [ownerAddress: string]: {
    safes: string[]
    timestamp: number
  }
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minute cache
const safeCache: SafeCache = {}

export class SafeAddressCache {
  /**
   * Get user's Safe address list (with cache)
   */
  static async getSafesForOwner(
    owner: string, 
    chainId: number,
    forceRefresh = false
  ): Promise<string[]> {
    const cacheKey = `${owner.toLowerCase()}-${chainId}`
    const now = Date.now()
    
    // Check cache
    if (!forceRefresh && safeCache[cacheKey]) {
      const cached = safeCache[cacheKey]
      if (now - cached.timestamp < CACHE_DURATION) {
        return cached.safes
      }
    }

    try {
      // Only query Polygon mainnet and local fork
      if (chainId !== 137 && chainId !== 1337) {
        return []
      }

      const ownerChecksum = owner as `0x${string}`
      const resp = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://safe-transaction-polygon.safe.global/api/v1/owners/${ownerChecksum}/safes/`)}`, 
        { cache: 'no-store' }
      )
      
      if (!resp.ok) {
        return []
      }
      
      const json = await resp.json()
      const safes: string[] = Array.isArray(json?.safes) ? json.safes : []
      
      // Update cache
      safeCache[cacheKey] = {
        safes,
        timestamp: now
      }
      
      return safes
    } catch (error) {
      console.warn('Failed to fetch Safe addresses:', error)
      return []
    }
  }

  /**
   * Clear cache for specified user
   */
  static clearCache(owner?: string) {
    if (owner) {
      const keys = Object.keys(safeCache).filter(key => 
        key.startsWith(owner.toLowerCase())
      )
      keys.forEach(key => delete safeCache[key])
    } else {
      // Clear all cache
      Object.keys(safeCache).forEach(key => delete safeCache[key])
    }
  }

  /**
   * Get cache status
   */
  static getCacheStatus() {
    return {
      totalCached: Object.keys(safeCache).length,
      cacheKeys: Object.keys(safeCache)
    }
  }
}
