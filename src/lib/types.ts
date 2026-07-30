export type CppTier = 'average' | 'aboveAverage' | 'maximum'
export type Act = 1 | 2 | 3 | 5
export type LegacyTargetAge = 25 | 40

export interface HealthChips {
  smoker: boolean
  diabetesFamily: boolean
  parentsPast85: boolean
  activeLifestyle: boolean
  chronicCondition: boolean
}

export interface Holding {
  tickerId: string
  amountPerPaycheque: number
}

export interface Assumptions {
  cppMaxAt65: number
  cppAverage: number
  cppAboveAverage: number
  oasAt65: number
  oasClawbackThreshold: number
  cppMaxAnnualContribution: number
  ympe: number
  cppEmployeeRate: number
  annualExemption: number
  payoutRate: number
  dailySpend: number
  goGoExtraSpend: number
  defaultRealReturn: number
  unallocatedGrowthReturn: number
  /** @deprecated prefer taxRatePerPeriod — kept for panel display */
  incomeTaxPerPaycheque: number
  /** @deprecated prefer eiRate */
  eiPremiumPerPaycheque: number
  rrspContributionPerPaycheque: number
  taxRatePerPeriod: number
  eiRate: number
}

export interface AppState {
  act: Act
  grossPerPaycheque: number
  paychequesPerYear: number
  fixedCostsPerPaycheque: number
  employerMatchPerPaycheque: number
  currentAge: number
  retirementAge: number
  cppTier: CppTier
  buckets: { income: number; growth: number; health: number; legacy: number }
  holdings: Holding[]
  healthChips: HealthChips
  child: { name: string; age: number }
  legacyTargetAge: LegacyTargetAge
  assumptions: Assumptions
}

export const BUCKET_COLORS = {
  income: '#2563EB',
  growth: '#059669',
  health: '#D97706',
  legacy: '#7C3AED',
} as const

export const GOLD = '#C9A227'
export const NAVY = '#0F1B2D'
