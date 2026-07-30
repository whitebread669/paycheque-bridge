import { TICKERS, type TickerId } from './engine'

/**
 * Seeded PRNG matching the verified reference build
 * (not classic mulberry32 — same family, different constants).
 */
export function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    let t = (s += 1831565813)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface PriceSeries {
  tickerId: TickerId
  prices: number[]
  totalReturn: number
}

const cache = new Map<string, PriceSeries>()

/** 252-point geometric random walk with reference noise + optional crash. */
export function generateSeries(tickerId: TickerId): PriceSeries {
  const cached = cache.get(tickerId)
  if (cached) return cached

  const meta = TICKERS.find((t) => t.tickerId === tickerId)
  if (!meta) throw new Error(`Unknown ticker ${tickerId}`)

  const rand = mulberry32(meta.seed)
  const prices: number[] = [100]
  for (let t = 1; t < 252; t++) {
    const noise = (rand() + rand() + rand() - 1.5) / 1.5
    let next =
      prices[t - 1]! *
      (1 + meta.walkDrift / 252 + (meta.vol / Math.sqrt(252)) * noise)
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
