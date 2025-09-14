import { NextResponse } from 'next/server'

// Fetch AAVE APY from DefiLlama's yields API (public, no key)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = (searchParams.get('symbol') || 'USDC').toUpperCase()
    const chain = (searchParams.get('chain') || 'polygon').toLowerCase()
    const project = searchParams.get('project') || 'aave-v3'

    const url = `https://yields.llama.fi/pools?chain=${encodeURIComponent(chain)}&project=${encodeURIComponent(project)}&symbol=${encodeURIComponent(symbol)}`
    const resp = await fetch(url, { next: { revalidate: 30 } })
    if (!resp.ok) {
      return NextResponse.json({ error: `Upstream error ${resp.status}` }, { status: 502 })
    }
    const json = await resp.json()
    const pools = Array.isArray(json?.data) ? json.data : []
    // Prefer stablecoin supply pool for the requested symbol
    const match = pools.find((p: Record<string, unknown>) => String(p.symbol).toUpperCase() === symbol && String(p.chain).toLowerCase() === chain)
    const apy = typeof match?.apy === 'number' ? match.apy : null
    return NextResponse.json({ apy })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}


