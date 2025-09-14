'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// interface PolymarketEntry {
//   id: string
//   question: string
//   conditionId: string
//   outcomes?: string
//   outcomePrices?: string
//   volumeNum?: number
//   volume24hr?: number
//   clobTokenIds?: string
// }

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

async function fetchMarketDirectly(args: { conditionIdLower?: string; slug?: string }): Promise<{ volume?: number; yesPrice?: number; noPrice?: number } | undefined> {
  try {
    let url: string
    let resp: Response

    if (args.slug) {
      // Fetch by slug
      url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://gamma-api.polymarket.com/markets/slug/${args.slug}`)}`
      resp = await fetch(url, { cache: 'no-store' })
      if (!resp.ok) throw new Error(`Polymarket API error: ${resp.status}`)
      
      const entry = await resp.json()
      const { yes, no } = parseOutcomePrices(entry)
      return {
        volume: typeof entry.volumeNum === 'number' ? entry.volumeNum : undefined,
        yesPrice: yes,
        noPrice: no
      }
    } else {
      // Fetch by condition ID
      const listUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://gamma-api.polymarket.com/markets?limit=1000&active=true&closed=false')}`
      resp = await fetch(listUrl, { cache: 'no-store' })
      if (!resp.ok) throw new Error(`Polymarket API error: ${resp.status}`)
      
      const arr = await resp.json()
      const entry = arr.find((e: { conditionId?: string }) => (e.conditionId || '').toLowerCase() === args.conditionIdLower)
      const { yes, no } = parseOutcomePrices(entry)
      return {
        volume: typeof entry?.volumeNum === 'number' ? entry.volumeNum : undefined,
        yesPrice: yes,
        noPrice: no
      }
    }
  } catch (error) {
    console.error('Failed to fetch Polymarket data:', error)
    throw error
  }
}

function parseOutcomePrices(entry?: { outcomePrices?: string }): { yes?: number; no?: number } {
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

// function parseOutcomePrices(entry?: PolymarketEntry): { yes?: number; no?: number } {
//   if (!entry) return {}
//   try {
//     const arr = JSON.parse(entry.outcomePrices || '[]') as (string | number)[]
//     if (Array.isArray(arr) && arr.length >= 2) {
//       const yes = Number(arr[0])
//       const no = Number(arr[1])
//       if (!Number.isNaN(yes) && !Number.isNaN(no)) return { yes, no }
//     }
//   } catch {}
//   return {}
// }

export function usePolymarketData(conditionIdOrSlug?: string, refreshMs: number = 60000, useSlug: boolean = false): MarketLiveData {
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
        const proxy = await fetchMarketDirectly(useSlug ? { slug: key } : { conditionIdLower: key })
        const data: MarketLiveData = {
          volume: proxy?.volume,
          yesPrice: proxy?.yesPrice,
          noPrice: proxy?.noPrice,
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


