import { useEffect, useState } from 'react'
import type { AppState } from '../lib/types'
import {
  cppContributionPerPaycheque,
  cppIncomePurchasedThisPeriod,
  discretionaryPool,
  eiPremium,
  formatMoney,
  formatNumber,
  incomeTax,
  netDeposit,
  retirementDaysFromLump,
  yearsToRetirement,
} from '../lib/engine'
import { Money } from './CountUp'
import { PayStub } from './PayStub'

export function Act2({
  state,
  onNext,
  onDays,
}: {
  state: AppState
  onNext: () => void
  onDays: (days: number) => void
}) {
  const [step, setStep] = useState(0)
  const a = state.assumptions
  const cpp = cppContributionPerPaycheque(
    state.grossPerPaycheque,
    state.paychequesPerYear,
    a,
  )
  const tax = incomeTax(state.grossPerPaycheque, a)
  const ei = eiPremium(state.grossPerPaycheque, a)
  const net = netDeposit(state)
  const pool = discretionaryPool(state)
  const years = yearsToRetirement(state.currentAge, state.retirementAge)
  const matchDays = retirementDaysFromLump(
    state.employerMatchPerPaycheque,
    years,
    state.paychequesPerYear,
    a,
  )
  const rrspDays = retirementDaysFromLump(
    a.rrspContributionPerPaycheque,
    years,
    state.paychequesPerYear,
    a,
  )
  const cppBought = cppIncomePurchasedThisPeriod(cpp, a)

  useEffect(() => {
    const timers = [1, 2, 3, 4].map((s, i) =>
      setTimeout(() => setStep(s), 900 + i * 1100),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    let days = 0
    if (step >= 2) days += matchDays
    if (step >= 3) days += rrspDays
    onDays(days)
  }, [step, matchDays, rrspDays, onDays])

  return (
    <section className="act act2">
      <div className="act-kicker">PAYDAY, TODAY</div>
      <PayStub
        title="PAY STATEMENT"
        subtitle="Employee: You · semi-monthly · watch closely"
        lines={[
          { label: 'Gross pay', amount: state.grossPerPaycheque },
          {
            label: 'Income tax',
            amount: tax,
            kind: 'deduct',
            revealed: step >= 4,
            reveal: <em className="reveal-grey">the one that's really gone</em>,
          },
          {
            label: 'CPP contribution',
            amount: cpp,
            kind: 'deduct',
            revealed: step >= 1,
            reveal: (
              <span>
                You just bought{' '}
                <strong>≈ {formatMoney(cppBought)}/month</strong> of guaranteed,
                inflation-indexed income. <strong>For life.</strong>
              </span>
            ),
          },
          {
            label: 'EI premium',
            amount: ei,
            kind: 'deduct',
            revealed: step >= 4,
            reveal: <em className="reveal-grey">insurance, not investment</em>,
          },
          {
            label: 'Employer RRSP match',
            amount: state.employerMatchPerPaycheque,
            kind: 'bonus',
            revealed: step >= 2,
            reveal: (
              <span>
                Free money:{' '}
                <strong>+{formatNumber(matchDays)} retirement days</strong>
              </span>
            ),
          },
          {
            label: 'RRSP contribution',
            amount: a.rrspContributionPerPaycheque,
            kind: 'deduct',
            revealed: step >= 3,
            reveal: (
              <span>
                <strong>+{formatNumber(rrspDays)} retirement days</strong> — money
                you'll meet again
              </span>
            ),
          },
        ]}
        netLabel="NET DEPOSIT"
        net={net}
      />
      <div className={`fixedcosts ${step >= 4 ? 'show' : ''}`}>
        <span>
          <Money value={state.fixedCostsPerPaycheque} /> of this is spoken for
          (rent, food, transport…)
        </span>
        <span className="fixedcosts-pool">
          → leaving <Money value={pool} className="gold" /> to allocate
        </span>
      </div>
      <button
        type="button"
        className={`cta ${step >= 4 ? '' : 'cta-hidden'}`}
        onClick={onNext}
      >
        You have {formatMoney(pool, 0)}. Put it to work.
      </button>
    </section>
  )
}
