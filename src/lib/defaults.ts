import type { AppState } from './types'
import { DEFAULT_ASSUMPTIONS } from './engine'

export function createInitialState(): AppState {
  return {
    act: 1,
    grossPerPaycheque: 5000,
    paychequesPerYear: 24,
    fixedCostsPerPaycheque: 2307, // addendum: yields exactly $1,200 discretionary
    employerMatchPerPaycheque: 150,
    currentAge: 35,
    retirementAge: 65,
    cppTier: 'average',
    buckets: { income: 0, growth: 0, health: 0, legacy: 0 },
    holdings: [],
    healthChips: {
      smoker: false,
      diabetesFamily: false,
      parentsPast85: false,
      activeLifestyle: false,
      chronicCondition: false,
    },
    child: { name: 'Maya', age: 4 },
    legacyTargetAge: 25,
    assumptions: { ...DEFAULT_ASSUMPTIONS },
  }
}

export function evenSplitBuckets(pool: number): AppState['buckets'] {
  const each = Math.floor((pool / 4) * 100) / 100
  const remainder = Math.round((pool - each * 4) * 100) / 100
  return {
    income: each,
    growth: each,
    health: each,
    legacy: each + remainder,
  }
}
