import { describe, expect, it } from 'vitest'
import {
  cppContributionPerPaycheque,
  cppIncomePurchasedThisPeriod,
  DEFAULT_ASSUMPTIONS,
  deriveAll,
  futureValueLump,
  futureValueRecurring,
  incomeBucketMonthly,
  legacyFutureValue,
  retirementDaysFromLump,
} from './engine'
import { generateSeries } from './tickers'
import { createInitialState, evenSplitBuckets } from './defaults'

const a = DEFAULT_ASSUMPTIONS

describe('CPP contribution (addendum)', () => {
  it('caps at ~$211.52 for $5,000 semi-monthly', () => {
    const cpp = cppContributionPerPaycheque(5000, 24, a)
    expect(cpp).toBeCloseTo(211.52, 1)
  })

  it('buys ≈ $1.93/mo indexed income', () => {
    const cpp = cppContributionPerPaycheque(5000, 24, a)
    const bought = cppIncomePurchasedThisPeriod(cpp, a)
    expect(bought).toBeCloseTo(1.93, 1)
  })
})

describe('discretionary pool', () => {
  it('yields exactly $1,200 with defaults', () => {
    const state = createInitialState()
    const d = deriveAll(state)
    expect(d.pool).toBe(1200)
  })
})

describe('retirement days (Act 2 one-shot)', () => {
  it('RRSP $150 ≈ +4.1 days', () => {
    const days = retirementDaysFromLump(150, 30, 24, a)
    expect(days).toBeCloseTo(4.1, 0)
  })
})

describe('even-split end state (addendum sanity)', () => {
  it('lands near verified ranges', () => {
    const state = createInitialState()
    state.buckets = evenSplitBuckets(1200)
    const d = deriveAll(state)

    const yours = incomeBucketMonthly(300, 30, 24, a)
    expect(yours).toBeGreaterThan(1700)
    expect(yours).toBeLessThan(1800)
    expect(d.projectedMonthlyIncome).toBeGreaterThan(3300)
    expect(d.projectedMonthlyIncome).toBeLessThan(3500)

    expect(d.nestEgg).toBeGreaterThan(1_200_000)
    expect(d.nestEgg).toBeLessThan(1_800_000)

    expect(d.netMonthly).toBeGreaterThan(5500)
    expect(d.netMonthly).toBeLessThan(8500)

    const legacy = legacyFutureValue(300, 4, 25, 24, a)
    expect(legacy).toBeGreaterThan(200_000)
    expect(legacy).toBeLessThan(280_000)

    expect(d.bleak.net).toBeCloseTo(1642.31, 1)
  })
})

describe('FV formulas', () => {
  it('recurring FV grows as expected', () => {
    const fv = futureValueRecurring(300, 0.04, 30, 24)
    expect(fv).toBeGreaterThan(400_000)
    expect(fv).toBeLessThan(430_000)
  })

  it('lump FV for $150 ~4.1 days of spend', () => {
    const fv = futureValueLump(150, 0.04, 30, 24)
    expect(fv / 120).toBeCloseTo(4.1, 0)
  })
})

describe('seeded tickers', () => {
  it('produce addendum personality returns', () => {
    const banks = generateSeries('BANKS')
    const energy = generateSeries('ENERGY')
    const bonds = generateSeries('BONDS')
    const tech = generateSeries('TECH')

    expect(banks.totalReturn).toBeCloseTo(0.103, 2)
    expect(energy.totalReturn).toBeCloseTo(0.189, 2)
    expect(bonds.totalReturn).toBeCloseTo(0.024, 2)
    expect(tech.totalReturn).toBeCloseTo(0.163, 2)
    // Crash applied after the normal step at t=130
    expect(tech.prices[130]!).toBeLessThan(tech.prices[129]!)
  })
})
