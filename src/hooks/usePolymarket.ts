'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface PolymarketEntry {
  id: string
  question: string
  conditionId: string
  outcomes?: string
  outcomePrices?: string
  volumeNum?: number
  volume24hr?: number
  clobTokenIds?: string
}

interface MarketLiveData {
  volume: number | undefined
  yesPrice: number | undefined
  noPrice: number | undefined
  loading: boolean
  error?: string
  updatedAt?: number
}

// Simple in-memory cache to avoid refetching same payloads too often
const cacheByConditionId = new Map<string, { data: MarketLiveData; ts: number }>()

async function fetchMarketViaProxy(args: { conditionIdLower?: string; slug?: string }): Promise<{ volume?: number; yes?: number; no?: number } | undefined> {
  const qs = new URLSearchParams()
  if (args.slug) qs.set('slug', args.slug)
  if (args.conditionIdLower) qs.set('conditionId', args.conditionIdLower)
  const url = `/api/polymarket?${qs.toString()}`
  const resp = await fetch(url, { cache: 'no-store' })
  if (!resp.ok) throw new Error(`Proxy error: ${resp.status}`)
  const data = await resp.json()
  return { volume: typeof data.volumeNum === 'number' ? data.volumeNum : undefined, yes: typeof data.yesPrice === 'number' ? data.yesPrice : undefined, no: typeof data.noPrice === 'number' ? data.noPrice : undefined }
}

function parseOutcomePrices(entry?: PolymarketEntry): { yes?: number; no?: number } {
  if (!entry) return {}
  try {
    const arr = JSON.parse(entry.outcomePrices || '[]') as (string | number)[]
    if (Array.isArray(arr) && arr.length >= 2) {
      const yes = Number(arr[0])
      const no = Number(arr[1])
      if (!Number.isNaN(yes) && !Number.isNaN(no)) return { yes, no }
    }
  } catch {}
  return {}
}

export function usePolymarketData(conditionIdOrSlug?: string, refreshMs: number = 10000, useSlug: boolean = false): MarketLiveData {
  const [state, setState] = useState<MarketLiveData>({ volume: undefined, yesPrice: undefined, noPrice: undefined, loading: !!conditionIdOrSlug })
  const key = (conditionIdOrSlug || '').toLowerCase()
  const timerRef = useRef<number | null>(null)
  const initializedRef = useRef<boolean>(false)

  const readCache = useMemo(() => {
    if (!key) return undefined
    const hit = cacheByConditionId.get(key)
    return hit?.data
  }, [key])

  useEffect(() => {
    if (!key) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    let cancelled = false

    async function loadOnce() {
      try {
        // Only show loading spinner on first load; keep prior values on refresh
        if (!initializedRef.current) {
          setState(s => ({ ...s, loading: true }))
        }
        const proxy = await fetchMarketViaProxy(useSlug ? { slug: key } : { conditionIdLower: key })
        const data: MarketLiveData = {
          volume: proxy?.volume,
          yesPrice: proxy?.yes,
          noPrice: proxy?.no,
          loading: false,
          updatedAt: Date.now()
        }
        cacheByConditionId.set(key, { data, ts: Date.now() })
        if (!cancelled) setState(prev => ({ ...prev, ...data }))
        initializedRef.current = true
      } catch (err) {
        // Preserve previous values on error; just attach error and stop loading
        if (!cancelled) setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Unknown error' }))
      }
    }

    // Serve cached immediately if present, then refresh
    if (readCache) {
      initializedRef.current = true
      setState({ ...readCache, loading: false })
    }
    loadOnce()

    // Polling
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(loadOnce, refreshMs)

    return () => {
      cancelled = true
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [key, refreshMs, readCache, useSlug])

  return state
}


