import { NextResponse } from 'next/server'

type PMEntry = {
  id: string
  question: string
  conditionId: string
  outcomes?: string
  outcomePrices?: string
  volumeNum?: number
  volume24hr?: number
}

function parseOutcomePrices(entry?: PMEntry): { yes?: number; no?: number } {
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cond = (searchParams.get('conditionId') || '').toLowerCase()
  const slug = (searchParams.get('slug') || '').trim()
  const limit = Number(searchParams.get('limit') || '1000')

  try {
    // Prefer slug endpoint when provided
    if (slug) {
      const resp = await fetch(`https://gamma-api.polymarket.com/markets/slug/${encodeURIComponent(slug)}`, { next: { revalidate: 0 } })
      if (!resp.ok) return NextResponse.json({ error: `Upstream error ${resp.status}` }, { status: 502 })
      const entry = (await resp.json()) as PMEntry
      const { yes, no } = parseOutcomePrices(entry)
      return NextResponse.json({
        id: entry?.id ?? null,
        conditionId: (entry?.conditionId || '').toLowerCase() || null,
        volumeNum: entry?.volumeNum ?? null,
        outcomePrices: entry?.outcomePrices ?? null,
        yesPrice: yes ?? null,
        noPrice: no ?? null
      })
    }

    const listUrl = `https://gamma-api.polymarket.com/markets?limit=${limit}&active=true&closed=false`
    const resp = await fetch(listUrl, { next: { revalidate: 0 } })
    if (!resp.ok) return NextResponse.json({ error: `Upstream error ${resp.status}` }, { status: 502 })
    const arr = (await resp.json()) as PMEntry[]

    if (!cond) {
      // Return trimmed list with minimal fields
      const data = arr.slice(0, 200).map(e => ({
        id: e.id,
        conditionId: e.conditionId,
        volumeNum: e.volumeNum,
        outcomePrices: e.outcomePrices
      }))
      return NextResponse.json({ data })
    }

    const entry = arr.find(e => (e.conditionId || '').toLowerCase() === cond)
    const { yes, no } = parseOutcomePrices(entry)
    return NextResponse.json({
      conditionId: cond,
      volumeNum: entry?.volumeNum ?? null,
      outcomePrices: entry?.outcomePrices ?? null,
      yesPrice: yes ?? null,
      noPrice: no ?? null
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}


