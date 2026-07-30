import { useEffect, useState } from 'react'
import type { AppState } from '../lib/types'
import { deriveAll, goGoEndAge, healthSpan } from '../lib/engine'
import { Money, Count } from './CountUp'
import { PayStub } from './PayStub'

export function Act5({
  state,
  onBack,
  onReset,
  onAssumptions,
}: {
  state: AppState
  onBack: () => void
  onReset: () => void
  onAssumptions: () => void
}) {
  const [ready, setReady] = useState(false)
  const d = deriveAll(state)
  const year =
    new Date().getFullYear() +
    Math.max(0, state.retirementAge - state.currentAge)
  const span = healthSpan(state.healthChips, state.retirementAge)
  const goGoYears = Math.max(
    0,
    goGoEndAge(state.healthChips, state.retirementAge) - state.retirementAge,
  )

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600)
    return () => clearTimeout(t)
  }, [])

  if (!ready) {
    return (
      <section className="act act5">
        <div className="fastforward">
          <div className="ff-years num">
            {new Date().getFullYear()} → {year}
          </div>
          <div className="ff-label">Fast-forwarding every payday…</div>
        </div>
      </section>
    )
  }

  const rebuiltLines = [
    {
      label: 'CPP retirement pension',
      amount: d.cpp,
      color: '#1E40AF',
    },
    {
      label: 'Old Age Security',
      amount: d.oas,
      color: '#1E40AF',
    },
    {
      label: 'Annuity income (Income bucket)',
      amount: d.annuity,
      color: '#2563EB',
    },
    {
      label: 'Registered savings drawdown',
      amount: d.registeredDrawdown,
      color: '#059669',
    },
    {
      label: 'Withholding tax on RRIF withdrawal',
      amount: d.withholdingTax,
      kind: 'deduct' as const,
    },
    ...(d.oasClawbackMonthly > 0.5
      ? [
          {
            label: 'OAS recovery tax (clawback)',
            amount: d.oasClawbackMonthly,
            kind: 'deduct' as const,
          },
        ]
      : []),
  ]

  return (
    <section className="act act5">
      <div className="act-kicker">PAYDAY, {year}</div>
      <div className="stub-compare">
        <div className="stub-col">
          <div className="stub-col-label">If nothing had changed</div>
          <PayStub
            title="RETIREMENT PAY STATEMENT"
            subtitle={`You, age ${state.retirementAge} · the bleak timeline`}
            lines={[
              {
                label: 'CPP retirement pension',
                amount: state.assumptions.cppAverage,
              },
              { label: 'Old Age Security', amount: state.assumptions.oasAt65 },
              { label: 'Your savings', amount: 0, kind: 'zero' },
            ]}
            netLabel="NET MONTHLY"
            net={d.bleak.net}
            dim
          />
        </div>
        <div className="stub-col">
          <div className="stub-col-label built">What you built</div>
          <PayStub
            title="RETIREMENT PAY STATEMENT"
            subtitle={`You, age ${state.retirementAge} · built one payday at a time`}
            lines={rebuiltLines}
            netLabel="NET MONTHLY"
            net={d.netMonthly}
          />
        </div>
      </div>

      <div className="final-counters">
        <div className="fc">
          <Money value={d.nestEgg} className="fc-num" />
          <span>nest egg at {state.retirementAge}</span>
        </div>
        <div className="fc">
          <Count value={d.totalDaysEarned} dec={0} className="fc-num gold" />
          <span>retirement days funded</span>
        </div>
        <div className="fc">
          <Count value={d.health.funded} dec={1} className="fc-num" />
          <span>
            of {goGoYears.toFixed(0)} go-go years funded
            {span.goGoEnd ? '' : ''}
          </span>
        </div>
        <div className="fc">
          <Money value={d.netMonthly - d.bleak.net} className="fc-num pos" />
          <span>more per month than the bleak timeline</span>
        </div>
      </div>

      <p className="closing">
        When the paycheque stops, <strong>this</strong> is what replaces it.
        <br />
        You built it one payday at a time.
      </p>

      <div className="act5-actions">
        <button type="button" className="cta" onClick={onBack}>
          Adjust my buckets
        </button>
        <button type="button" className="cta ghost" onClick={onAssumptions}>
          Assumptions
        </button>
        <button type="button" className="cta ghost" onClick={onReset}>
          Reset demo
        </button>
      </div>
    </section>
  )
}
