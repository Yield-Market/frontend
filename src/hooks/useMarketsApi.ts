import { useState, useEffect, useCallback, useRef } from 'react'
import { MarketsApi, Configuration, HandlersMarketItem, HandlersMarketsListResponse } from '@/generated/api/src'

interface UseMarketsApiOptions {
  page?: number
  pageSize?: number
  category?: string
  status?: string
  search?: string
}

interface UseMarketsApiReturn {
  markets: HandlersMarketItem[] | null
  total: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMarketsApi(options: UseMarketsApiOptions = {}): UseMarketsApiReturn {
  const [markets, setMarkets] = useState<HandlersMarketItem[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use refs to track the latest options without causing re-renders
  const searchRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    page = 1,
    pageSize = 10,
    category,
    status,
    search
  } = options

  const fetchMarkets = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true)
      setError(null)

      const config = new Configuration({
        basePath: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
      })
      
      const api = new MarketsApi(config)
      
      const response: HandlersMarketsListResponse = await api.apiV1MarketsGet({
        page,
        pageSize,
        category,
        status,
        q: searchQuery !== undefined ? searchQuery : search
      })
      
      setMarkets(response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      console.error('Failed to fetch markets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch markets')
      setMarkets([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, category, status, search])

  // Debounce search queries
  useEffect(() => {
    if (search !== searchRef.current) {
      searchRef.current = search || ''
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Set new timeout for search
      if (search) {
        timeoutRef.current = setTimeout(() => {
          fetchMarkets(search)
        }, 300) // 300ms debounce
      } else {
        // If search is empty, fetch immediately
        fetchMarkets('')
      }
    } else {
      // For non-search parameter changes, fetch immediately
      fetchMarkets()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [fetchMarkets, search])

  return {
    markets,
    total,
    loading,
    error,
    refetch: () => fetchMarkets()
  }
}