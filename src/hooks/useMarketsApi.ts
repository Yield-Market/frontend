import { useState, useEffect, useCallback } from 'react'
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

  const {
    page = 1,
    pageSize = 10,
    category,
    status,
    search
  } = options

  const fetchMarkets = useCallback(async () => {
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
        q: search
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

  useEffect(() => {
    fetchMarkets()
  }, [fetchMarkets])

  return {
    markets,
    total,
    loading,
    error,
    refetch: fetchMarkets
  }
}