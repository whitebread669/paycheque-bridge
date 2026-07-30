import { TICKERS, type TickerId } from './engine'

/** Classic mulberry32 — SPEC §6.1 / §10. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface PriceSeries {
  tickerId: TickerId
  prices: number[]
  totalReturn: number
}

const cache = new Map<string, PriceSeries>()

/**
 * 252-point geometric random walk (SPEC §6.1):
 *   price[t] = price[t-1] × (1 + drift/252 + vol × noise)
 * noise = triangular approx via 3×U, scaled by 1/√252.
 * Seeds & TECH crash at t=130 ×0.82: SPEC §10.
 */
export function generateSeries(tickerId: TickerId): PriceSeries {
  const cached = cache.get(tickerId)
  if (cached) return cached

  const meta = TICKERS.find((t) => t.tickerId === tickerId)
  if (!meta) throw new Error(`Unknown ticker ${tickerId}`)

  const rand = mulberry32(meta.seed)
  const prices: number[] = [100]
  for (let t = 1; t < 252; t++) {
    // Mean-zero noise in ~[-1, 1], then × vol / √252  ≡  vol × noise in the SPEC formula
    const noise = (rand() + rand() + rand() - 1.5) / 1.5 / Math.sqrt(252)
    let next = prices[t - 1]! * (1 + meta.walkDrift / 252 + meta.vol * noise)
    if (meta.crashAt !== undefined && t === meta.crashAt) {
      next *= 0.82
    }
    prices.push(Math.max(5, next))
  }

  const totalReturn = (prices[prices.length - 1]! - prices[0]!) / prices[0]!
  const series: PriceSeries = { tickerId, prices, totalReturn }
  cache.set(tickerId, series)
  return series
}

export function allSeries(): PriceSeries[] {
  return TICKERS.map((t) => generateSeries(t.tickerId))
}
