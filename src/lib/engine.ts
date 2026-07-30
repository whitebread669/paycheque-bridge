import type {
  AppState,
  Assumptions,
  CppTier,
  HealthChips,
  Holding,
} from './types'

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  cppMaxAt65: 1507.65,
  cppAverage: 900,
  cppAboveAverage: 1200,
  oasAt65: 742.31,
  oasClawbackThreshold: 95_000,
  cppMaxAnnualContribution: 4230.45,
  ympe: 74_600,
  cppEmployeeRate: 0.0595,
  annualExemption: 3500,
  payoutRate: 0.05,
  dailySpend: 120,
  goGoExtraSpend: 15_000,
  defaultRealReturn: 0.04,
  unallocatedGrowthReturn: 0.02,
  incomeTaxPerPaycheque: 1050,
  eiPremiumPerPaycheque: 81.5,
  rrspContributionPerPaycheque: 150,
  taxRatePerPeriod: 0.21,
  eiRate: 0.0163,
}

export const TICKERS = [
  {
    tickerId: 'BANKS',
    name: 'Canadian Banks Index',
    drift: 0.065,
    /** Walk drift can differ from stated drift (TECH uses 0.13 for personality). */
    walkDrift: 0.065,
    vol: 0.1,
    seed: 17,
    crashAt: undefined as number | undefined,
    blurb: 'Steady dividend payers. The stair-step of Canadian investing.',
  },
  {
    tickerId: 'ENERGY',
    name: 'Alberta Energy Fund',
    drift: 0.08,
    walkDrift: 0.08,
    vol: 0.28,
    seed: 26,
    crashAt: undefined as number | undefined,
    blurb: 'Boom and bust. Calgary knows this chart by heart.',
  },
  {
    tickerId: 'BONDS',
    name: 'Maple Bond Fund',
    drift: 0.03,
    walkDrift: 0.03,
    vol: 0.04,
    seed: 13,
    crashAt: undefined as number | undefined,
    blurb: 'Nearly flat. Sleeps well at night.',
  },
  {
    tickerId: 'TECH',
    name: 'Cowtown Growth Tech',
    drift: 0.11,
    walkDrift: 0.13,
    vol: 0.38,
    seed: 33,
    crashAt: 130,
    blurb: 'Hockey stick — with a mid-season injury.',
  },
] as const

export type TickerId = (typeof TICKERS)[number]['tickerId']

export const TICKER_DRIFTS: Record<string, number> = Object.fromEntries(
  TICKERS.map((t) => [t.tickerId, t.drift]),
)

/** Future value of a recurring contribution (annuity). Periods = round(years × ppy). */
export function futureValueRecurring(
  payment: number,
  annualRealReturn: number,
  years: number,
  paychequesPerYear: number,
): number {
  if (payment <= 0 || years <= 0) return 0
  const i = annualRealReturn / paychequesPerYear
  const n = Math.round(years * paychequesPerYear)
  if (i === 0) return payment * n
  return (payment * (Math.pow(1 + i, n) - 1)) / i
}

/** One-shot compound FV (used for Act 2 retirement-day reveals). */
export function futureValueLump(
  principal: number,
  annualRealReturn: number,
  years: number,
  paychequesPerYear: number,
): number {
  if (principal <= 0 || years <= 0) return principal
  const n = years * paychequesPerYear
  const i = annualRealReturn / paychequesPerYear
  return principal * Math.pow(1 + i, n)
}

export function yearsToRetirement(currentAge: number, retirementAge: number): number {
  return Math.max(0, retirementAge - currentAge)
}

export function incomeTax(gross: number, assumptions: Assumptions): number {
  return assumptions.taxRatePerPeriod * gross
}

export function eiPremium(gross: number, assumptions: Assumptions): number {
  return assumptions.eiRate * gross
}

export function cppContributionPerPaycheque(
  gross: number,
  paychequesPerYear: number,
  assumptions: Assumptions,
): number {
  const exemptionPerPeriod = assumptions.annualExemption / paychequesPerYear
  const raw = assumptions.cppEmployeeRate * Math.max(0, gross - exemptionPerPeriod)
  const cap = (assumptions.cppMaxAnnualContribution / paychequesPerYear) * 1.2
  return Math.min(raw, cap)
}

export function netDeposit(input: {
  grossPerPaycheque: number
  paychequesPerYear: number
  assumptions: Assumptions
}): number {
  const a = input.assumptions
  return (
    input.grossPerPaycheque -
    incomeTax(input.grossPerPaycheque, a) -
    cppContributionPerPaycheque(input.grossPerPaycheque, input.paychequesPerYear, a) -
    eiPremium(input.grossPerPaycheque, a) -
    a.rrspContributionPerPaycheque
  )
}

export function discretionaryPool(input: {
  grossPerPaycheque: number
  paychequesPerYear: number
  fixedCostsPerPaycheque: number
  assumptions: Assumptions
}): number {
  return Math.max(
    0,
    Math.round(netDeposit(input) - input.fixedCostsPerPaycheque),
  )
}

export function cppIncomePurchasedThisPeriod(
  periodContribution: number,
  assumptions: Assumptions,
): number {
  return (
    (periodContribution / assumptions.cppMaxAnnualContribution) *
    (assumptions.cppMaxAt65 / 39)
  )
}

export function cppBaseAt65(tier: CppTier, assumptions: Assumptions): number {
  switch (tier) {
    case 'average':
      return assumptions.cppAverage
    case 'aboveAverage':
      return assumptions.cppAboveAverage
    case 'maximum':
      return assumptions.cppMaxAt65
  }
}

export function cppMonthly(
  tier: CppTier,
  retirementAge: number,
  assumptions: Assumptions,
): number {
  const base = cppBaseAt65(tier, assumptions)
  if (retirementAge < 65) {
    return base * (1 - 0.006 * 12 * (65 - retirementAge))
  }
  return base * (1 + 0.007 * 12 * Math.min(5, retirementAge - 65))
}

export function oasMonthly(retirementAge: number, assumptions: Assumptions): number {
  if (retirementAge < 65) return 0
  return assumptions.oasAt65 * (1 + 0.006 * 12 * Math.min(5, retirementAge - 65))
}

export function blendedGrowthReturn(
  holdings: Holding[],
  growthAllocation: number,
  assumptions: Assumptions,
  drifts: Record<string, number> = TICKER_DRIFTS,
): number {
  if (growthAllocation <= 0) return assumptions.unallocatedGrowthReturn
  const allocated = holdings.reduce((s, h) => s + h.amountPerPaycheque, 0)
  let weighted =
    Math.max(0, growthAllocation - allocated) * assumptions.unallocatedGrowthReturn
  for (const h of holdings) {
    weighted += h.amountPerPaycheque * (drifts[h.tickerId] ?? 0.04)
  }
  return weighted / growthAllocation
}

export function retirementDaysFromLump(
  contribution: number,
  years: number,
  paychequesPerYear: number,
  assumptions: Assumptions,
  annualRealReturn?: number,
): number {
  if (contribution <= 0) return 0
  const rate = annualRealReturn ?? assumptions.defaultRealReturn
  return (
    (contribution *
      Math.pow(1 + rate / paychequesPerYear, years * paychequesPerYear)) /
    assumptions.dailySpend
  )
}

export function incomeBucketMonthly(
  incomeAllocation: number,
  years: number,
  paychequesPerYear: number,
  assumptions: Assumptions,
): number {
  const fv = futureValueRecurring(
    incomeAllocation,
    assumptions.defaultRealReturn,
    years,
    paychequesPerYear,
  )
  return (fv * assumptions.payoutRate) / 12
}

export function goGoEndAge(chips: HealthChips, retirementAge: number): number {
  let end = 75
  if (chips.smoker) end -= 4
  if (chips.diabetesFamily) end -= 2
  if (chips.parentsPast85) end += 3
  if (chips.activeLifestyle) end += 2
  if (chips.chronicCondition) end -= 3
  return Math.min(90, Math.max(retirementAge, end))
}

export function healthSpan(chips: HealthChips, retirementAge: number) {
  const goGoEnd = goGoEndAge(chips, retirementAge)
  const delta = goGoEnd - 75
  const slowGoEnd = Math.min(92, Math.max(goGoEnd, 82 + delta))
  const lifeExpectancy = Math.min(96, Math.max(goGoEnd + 1, 87 + delta))
  const goGoYears = Math.max(0, goGoEnd - retirementAge)
  return { goGoEnd, slowGoEnd, lifeExpectancy, goGoYears }
}

export function fundedGoGoYears(
  healthAllocation: number,
  chips: HealthChips,
  retirementAge: number,
  currentAge: number,
  paychequesPerYear: number,
  assumptions: Assumptions,
): { funded: number; total: number; fv: number } {
  const span = healthSpan(chips, retirementAge)
  const years = yearsToRetirement(currentAge, retirementAge)
  const fv = futureValueRecurring(
    healthAllocation,
    assumptions.defaultRealReturn,
    years,
    paychequesPerYear,
  )
  const funded = Math.min(span.goGoYears, fv / assumptions.goGoExtraSpend)
  return { funded, total: span.goGoYears, fv }
}

export function legacyFutureValue(
  legacyAllocation: number,
  childAge: number,
  targetAge: number,
  paychequesPerYear: number,
  assumptions: Assumptions,
): number {
  const years = Math.max(0, targetAge - childAge)
  return futureValueRecurring(
    legacyAllocation,
    assumptions.defaultRealReturn,
    years,
    paychequesPerYear,
  )
}

export function bucketSum(buckets: AppState['buckets']): number {
  return buckets.income + buckets.growth + buckets.health + buckets.legacy
}

export type DerivedInputs = Pick<
  AppState,
  | 'grossPerPaycheque'
  | 'paychequesPerYear'
  | 'fixedCostsPerPaycheque'
  | 'employerMatchPerPaycheque'
  | 'currentAge'
  | 'retirementAge'
  | 'cppTier'
  | 'buckets'
  | 'holdings'
  | 'healthChips'
  | 'child'
  | 'legacyTargetAge'
  | 'assumptions'
>

export function deriveAll(input: DerivedInputs) {
  const a = input.assumptions
  const years = yearsToRetirement(input.currentAge, input.retirementAge)
  const cppPeriod = cppContributionPerPaycheque(
    input.grossPerPaycheque,
    input.paychequesPerYear,
    a,
  )
  const tax = incomeTax(input.grossPerPaycheque, a)
  const ei = eiPremium(input.grossPerPaycheque, a)
  const net = netDeposit(input)
  const pool = discretionaryPool(input)
  const allocated = bucketSum(input.buckets)

  const cpp = cppMonthly(input.cppTier, input.retirementAge, a)
  const oas = oasMonthly(input.retirementAge, a)
  const cppBought = cppIncomePurchasedThisPeriod(cppPeriod, a)

  const growthRate = blendedGrowthReturn(
    input.holdings,
    input.buckets.growth,
    a,
  )
  const incomeEgg = futureValueRecurring(
    input.buckets.income,
    a.defaultRealReturn,
    years,
    input.paychequesPerYear,
  )
  const growthEgg = futureValueRecurring(
    input.buckets.growth,
    growthRate,
    years,
    input.paychequesPerYear,
  )
  const healthEgg = futureValueRecurring(
    input.buckets.health,
    a.defaultRealReturn,
    years,
    input.paychequesPerYear,
  )
  const rrspEgg = futureValueRecurring(
    a.rrspContributionPerPaycheque + input.employerMatchPerPaycheque,
    a.defaultRealReturn,
    years,
    input.paychequesPerYear,
  )
  const annuity = (incomeEgg * a.payoutRate) / 12
  // Reference: registered drawdown at 4% real on RRSP + growth + health eggs
  const registeredDrawdown = ((rrspEgg + growthEgg + healthEgg) * 0.04) / 12

  const nestEgg = rrspEgg + growthEgg + healthEgg + incomeEgg
  const legacyFv = legacyFutureValue(
    input.buckets.legacy,
    input.child.age,
    input.legacyTargetAge,
    input.paychequesPerYear,
    a,
  )

  let rebuiltGross = cpp + oas + annuity + registeredDrawdown
  const annual = rebuiltGross * 12
  let clawbackMonthly = 0
  if (annual > a.oasClawbackThreshold && oas > 0) {
    clawbackMonthly = Math.min(
      oas,
      ((annual - a.oasClawbackThreshold) * 0.15) / 12,
    )
    rebuiltGross -= clawbackMonthly
  }

  // Shown on the rebuilt stub (SPEC); net matches verified reference (clawback only).
  const withholdingTax = (annuity + registeredDrawdown) * 0.1
  const netMonthly = rebuiltGross

  const health = fundedGoGoYears(
    input.buckets.health,
    input.healthChips,
    input.retirementAge,
    input.currentAge,
    input.paychequesPerYear,
    a,
  )
  const span = healthSpan(input.healthChips, input.retirementAge)

  // Act 2 / live counter: one-shot days (legacy excluded from day counter)
  const act2BaseDays =
    retirementDaysFromLump(
      a.rrspContributionPerPaycheque,
      years,
      input.paychequesPerYear,
      a,
    ) +
    retirementDaysFromLump(
      input.employerMatchPerPaycheque,
      years,
      input.paychequesPerYear,
      a,
    )
  const daysFromBuckets =
    retirementDaysFromLump(
      input.buckets.income + input.buckets.health,
      years,
      input.paychequesPerYear,
      a,
    ) +
    retirementDaysFromLump(
      input.buckets.growth,
      years,
      input.paychequesPerYear,
      a,
      growthRate,
    )
  const daysPerPaycheque = act2BaseDays + daysFromBuckets
  const totalDaysEarned = nestEgg / a.dailySpend

  const bleakCpp = cppBaseAt65(input.cppTier, a)
  const bleakOas = a.oasAt65
  const bleakNet = bleakCpp + bleakOas

  return {
    years,
    tax,
    ei,
    cppPeriod,
    cppBought,
    net,
    pool,
    allocated,
    remaining: pool - allocated,
    cpp,
    oas,
    annuity,
    incomeEgg,
    growthEgg,
    healthEgg,
    rrspEgg,
    nestEgg,
    registeredDrawdown,
    withholdingTax,
    oasClawbackMonthly: clawbackMonthly,
    netMonthly,
    grossMonthlyBeforeTax: cpp + oas + annuity + registeredDrawdown,
    health,
    span,
    legacyFv,
    act2BaseDays,
    daysFromBuckets,
    daysPerPaycheque,
    retirementDaysTotal: daysPerPaycheque,
    totalDaysEarned,
    projectedMonthlyIncome: cpp + oas + annuity,
    growthRate,
    bleak: {
      cpp: bleakCpp,
      oas: bleakOas,
      savings: 0,
      net: bleakNet,
    },
  }
}

export function formatMoney(n: number, digits = 2): string {
  return n.toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatNumber(n: number, digits = 1): string {
  return n.toLocaleString('en-CA', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function retirementDate(
  currentAge: number,
  retirementAge: number,
  from = new Date(),
): Date {
  const d = new Date(from)
  d.setFullYear(d.getFullYear() + Math.max(0, retirementAge - currentAge))
  return d
}

export function formatStubDate(d: Date): string {
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
