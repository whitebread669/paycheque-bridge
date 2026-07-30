import { useState } from 'react'
import type { AppState, HealthChips } from '../lib/types'
import {
  TICKERS,
  blendedGrowthReturn,
  cppMonthly,
  discretionaryPool,
  formatMoney,
  fundedGoGoYears,
  futureValueRecurring,
  healthSpan,
  incomeBucketMonthly,
  legacyFutureValue,
  oasMonthly,
  yearsToRetirement,
} from '../lib/engine'
import { Money, Count } from './CountUp'
import { BucketCard } from './BucketCard'
import { Sparkline } from './Sparkline'
import { BUCKET_COLORS } from '../lib/types'

const HEALTH_CHIPS: {
  key: keyof HealthChips
  label: string
  effect: string
}[] = [
  { key: 'smoker', label: 'Smoker', effect: '−4 go-go years' },
  { key: 'diabetesFamily', label: 'Diabetes in family', effect: '−2 go-go years' },
  { key: 'parentsPast85', label: 'Parents lived past 85', effect: '+3 go-go years' },
  { key: 'activeLifestyle', label: 'Active lifestyle', effect: '+2 go-go years' },
  { key: 'chronicCondition', label: 'Chronic condition', effect: '−3 go-go years' },
]

type BucketKey = keyof AppState['buckets']

export function Act3({
  state,
  setState,
  onNext,
}: {
  state: AppState
  setState: (fn: (s: AppState) => AppState) => void
  onNext: () => void
}) {
  const pool = discretionaryPool(state)
  const allocated =
    state.buckets.income +
    state.buckets.growth +
    state.buckets.health +
    state.buckets.legacy
  const remaining = pool - allocated

  const setBucket = (key: BucketKey, value: number) => {
    setState((s) => {
      const others = (['income', 'growth', 'health', 'legacy'] as BucketKey[])
        .filter((k) => k !== key)
        .reduce((sum, k) => sum + s.buckets[k], 0)
      const capped = Math.max(0, Math.min(value, pool - others))
      let next: AppState = {
        ...s,
        buckets: { ...s.buckets, [key]: capped },
      }
      if (key === 'growth') {
        const held = next.holdings.reduce((n, h) => n + h.amountPerPaycheque, 0)
        if (held > capped && held > 0) {
          const scale = capped / held
          next = {
            ...next,
            holdings: next.holdings
              .map((h) => ({
                ...h,
                amountPerPaycheque: Math.floor(h.amountPerPaycheque * scale),
              }))
              .filter((h) => h.amountPerPaycheque > 0),
          }
        }
      }
      return next
    })
  }

  const evenSplit = () => {
    const each = Math.floor(pool / 4)
    setState((s) => ({
      ...s,
      buckets: { income: each, growth: each, health: each, legacy: each },
    }))
  }

  const allInOne = (key: BucketKey) => {
    setState((s) => ({
      ...s,
      buckets: {
        income: key === 'income' ? pool : 0,
        growth: key === 'growth' ? pool : 0,
        health: key === 'health' ? pool : 0,
        legacy: key === 'legacy' ? pool : 0,
      },
      holdings: key === 'growth' ? s.holdings : [],
    }))
  }

  const reset = () => {
    setState((s) => ({
      ...s,
      buckets: { income: 0, growth: 0, health: 0, legacy: 0 },
      holdings: [],
    }))
  }

  const years = yearsToRetirement(state.currentAge, state.retirementAge)
  const a = state.assumptions
  const cpp = cppMonthly(state.cppTier, state.retirementAge, a)
  const oas = oasMonthly(state.retirementAge, a)
  const yours = incomeBucketMonthly(
    state.buckets.income,
    years,
    state.paychequesPerYear,
    a,
  )
  const monthlyTotal = cpp + oas + yours
  const stackMax = 6000

  const growthRate = blendedGrowthReturn(
    state.holdings,
    state.buckets.growth,
    a,
  )
  const growthEgg = futureValueRecurring(
    state.buckets.growth,
    growthRate,
    years,
    state.paychequesPerYear,
  )
  const held = state.holdings.reduce((n, h) => n + h.amountPerPaycheque, 0)
  const cashOnHand = state.buckets.growth - held

  const buy = (tickerId: string, amount: number) => {
    setState((s) => {
      const allocatedNow = s.holdings.reduce((n, h) => n + h.amountPerPaycheque, 0)
      const free = s.buckets.growth - allocatedNow
      const delta = amount > 0 ? Math.min(amount, free) : amount
      if (delta === 0 && amount > 0) return s
      const existing = s.holdings.find((h) => h.tickerId === tickerId)
      let holdings
      if (existing) {
        holdings = s.holdings
          .map((h) =>
            h.tickerId === tickerId
              ? {
                  ...h,
                  amountPerPaycheque: Math.max(0, h.amountPerPaycheque + delta),
                }
              : h,
          )
          .filter((h) => h.amountPerPaycheque > 0)
      } else if (delta > 0) {
        holdings = [...s.holdings, { tickerId, amountPerPaycheque: delta }]
      } else {
        holdings = s.holdings
      }
      return { ...s, holdings }
    })
  }

  const span = healthSpan(state.healthChips, state.retirementAge)
  const health = fundedGoGoYears(
    state.buckets.health,
    state.healthChips,
    state.retirementAge,
    state.currentAge,
    state.paychequesPerYear,
    a,
  )
  const lifeSpanYears = span.lifeExpectancy - state.retirementAge || 1
  const pct = (from: number, to: number) =>
    `${Math.max(0, ((to - from) / lifeSpanYears) * 100)}%`

  const [legacyAge, setLegacyAge] = useState<25 | 40>(state.legacyTargetAge)
  const legacyFv = legacyFutureValue(
    state.buckets.legacy,
    state.child.age,
    legacyAge,
    state.paychequesPerYear,
    a,
  )

  return (
    <section className="act act3">
      <div className="act-kicker">EVERY DOLLAR HAS ONE JOB</div>
      <h2 className="act-title">The Four Buckets</h2>

      <div className="pool">
        <div className="pool-bar">
          {(
            [
              ['income', BUCKET_COLORS.income],
              ['growth', BUCKET_COLORS.growth],
              ['health', BUCKET_COLORS.health],
              ['legacy', BUCKET_COLORS.legacy],
            ] as const
          ).map(([key, color]) => (
            <div
              key={key}
              className="pool-seg"
              style={{
                width: `${(state.buckets[key] / pool) * 100}%`,
                background: color,
              }}
            />
          ))}
          <div
            className="pool-seg pool-unalloc"
            style={{ width: `${(remaining / pool) * 100}%` }}
          />
        </div>
        <div className="pool-meta">
          <span>
            <Money value={remaining} className="gold" /> unallocated of{' '}
            {formatMoney(pool, 0)} per paycheque
          </span>
          <span className="pool-actions">
            <button type="button" onClick={evenSplit}>
              Even split
            </button>
            <button type="button" onClick={() => allInOne('growth')}>
              All in one
            </button>
            <button type="button" onClick={reset}>
              Reset
            </button>
          </span>
        </div>
      </div>

      <div className="buckets">
        <BucketCard
          name="Income"
          tag="Buy a paycheque that doesn't stop"
          color={BUCKET_COLORS.income}
          alloc={state.buckets.income}
          onAlloc={(n) => setBucket('income', n)}
          max={pool}
        >
          <div className="big-stat">
            <Money value={monthlyTotal} />
            <span className="big-stat-unit">/month at {state.retirementAge}</span>
          </div>
          <div className="stack-bar">
            <div
              style={{
                width: `${Math.min(100, (cpp / stackMax) * 100)}%`,
                background: '#1E40AF',
              }}
              title="CPP"
            />
            <div
              style={{
                width: `${Math.min(100, (oas / stackMax) * 100)}%`,
                background: '#3B82F6',
              }}
              title="OAS"
            />
            <div
              style={{
                width: `${Math.min(100, (yours / stackMax) * 100)}%`,
                background: '#93C5FD',
              }}
              title="Yours"
            />
          </div>
          <div className="stack-legend">
            <span>
              <i style={{ background: '#1E40AF' }} />
              CPP {formatMoney(cpp, 0)}
            </span>
            <span>
              <i style={{ background: '#3B82F6' }} />
              OAS {formatMoney(oas, 0)}
            </span>
            <span>
              <i style={{ background: '#93C5FD' }} />
              Yours {formatMoney(yours, 0)}
            </span>
          </div>
          <label className="field">
            Retire at <strong>{state.retirementAge}</strong>
            <input
              type="range"
              min={60}
              max={70}
              value={state.retirementAge}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  retirementAge: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="field">
            CPP history
            <select
              value={state.cppTier}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  cppTier: e.target.value as AppState['cppTier'],
                }))
              }
            >
              <option value="average">Average earner</option>
              <option value="aboveAverage">Above average</option>
              <option value="maximum">Maximum contributor</option>
            </select>
          </label>
          {state.retirementAge >= 70 ? (
            <div className="microcopy">
              Waiting pays: CPP grows 8.4%/yr after 65, guaranteed.
            </div>
          ) : null}
          {state.retirementAge < 65 ? (
            <div className="microcopy warn">
              Before 65: CPP shrinks 7.2%/yr and OAS hasn't started.
            </div>
          ) : null}
        </BucketCard>

        <BucketCard
          name="Growth"
          tag="The nest egg that compounds"
          color={BUCKET_COLORS.growth}
          alloc={state.buckets.growth}
          onAlloc={(n) => setBucket('growth', n)}
          max={pool}
        >
          <div className="big-stat">
            <Money value={growthEgg} />
            <span className="big-stat-unit">nest egg at {state.retirementAge}</span>
          </div>
          <div className="microcopy">
            blended return {(growthRate * 100).toFixed(1)}% · cash on hand{' '}
            {formatMoney(Math.max(0, cashOnHand), 0)}/paycheque
          </div>
          <div className="tickers">
            {TICKERS.map((t) => {
              const holding = state.holdings.find((h) => h.tickerId === t.tickerId)
              return (
                <div key={t.tickerId} className="ticker">
                  <div className="ticker-info">
                    <span className="ticker-sym">{t.tickerId}</span>
                    <span className="ticker-name">{t.name}</span>
                  </div>
                  <Sparkline tickerId={t.tickerId} />
                  <div className="ticker-actions">
                    <button
                      type="button"
                      onClick={() => buy(t.tickerId, 50)}
                      disabled={cashOnHand < 10}
                    >
                      Buy $50
                    </button>
                    {holding ? (
                      <button
                        type="button"
                        className="sell"
                        onClick={() => buy(t.tickerId, -50)}
                      >
                        Sell
                      </button>
                    ) : null}
                  </div>
                  {holding ? (
                    <div className="ticker-held num">
                      {formatMoney(holding.amountPerPaycheque, 0)}/pay
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </BucketCard>

        <BucketCard
          name="Health"
          tag="The Good Years meter"
          color={BUCKET_COLORS.health}
          alloc={state.buckets.health}
          onAlloc={(n) => setBucket('health', n)}
          max={pool}
        >
          <div className="big-stat">
            <Count value={health.funded} dec={1} />
            <span className="big-stat-unit">
              of your ~{health.total.toFixed(0)} go-go years funded
            </span>
          </div>
          <div className="life-bar">
            <div className="life-gogo" style={{ width: pct(state.retirementAge, span.goGoEnd) }}>
              go-go
            </div>
            <div
              className="life-slowgo"
              style={{ width: pct(span.goGoEnd, span.slowGoEnd) }}
            >
              slow-go
            </div>
            <div
              className="life-nogo"
              style={{ width: pct(span.slowGoEnd, span.lifeExpectancy) }}
            >
              no-go
            </div>
          </div>
          <div className="life-ages">
            <span>{state.retirementAge}</span>
            <span>{span.goGoEnd}</span>
            <span>{span.slowGoEnd}</span>
            <span>{span.lifeExpectancy}</span>
          </div>
          <div className="chips">
            {HEALTH_CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={`chip ${state.healthChips[chip.key] ? 'chip-on' : ''}`}
                title={chip.effect}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    healthChips: {
                      ...s.healthChips,
                      [chip.key]: !s.healthChips[chip.key],
                    },
                  }))
                }
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="microcopy">
            You might not have 30 good years. Fund the ones you'll get.
          </div>
        </BucketCard>

        <BucketCard
          name="Legacy"
          tag="Help without raiding the other three"
          color={BUCKET_COLORS.legacy}
          alloc={state.buckets.legacy}
          onAlloc={(n) => setBucket('legacy', n)}
          max={pool}
        >
          <div className="big-stat">
            <Money value={legacyFv} />
            <span className="big-stat-unit">
              when {state.child.name || 'they'} turns {legacyAge}
            </span>
          </div>
          <div className="legacy-fields">
            <label className="field">
              Name
              <input
                type="text"
                value={state.child.name}
                maxLength={14}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    child: { ...s.child, name: e.target.value },
                  }))
                }
              />
            </label>
            <label className="field">
              Age today
              <input
                type="number"
                min={0}
                max={30}
                value={state.child.age}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    child: {
                      ...s.child,
                      age: Math.max(0, Math.min(30, Number(e.target.value))),
                    },
                  }))
                }
              />
            </label>
            <div className="seg">
              <button
                type="button"
                className={legacyAge === 25 ? 'on' : ''}
                onClick={() => {
                  setLegacyAge(25)
                  setState((s) => ({ ...s, legacyTargetAge: 25 }))
                }}
              >
                at 25
              </button>
              <button
                type="button"
                className={legacyAge === 40 ? 'on' : ''}
                onClick={() => {
                  setLegacyAge(40)
                  setState((s) => ({ ...s, legacyTargetAge: 40 }))
                }}
              >
                at 40
              </button>
            </div>
          </div>
          <div className="microcopy">
            Help them every payday — without raiding the other three buckets.
          </div>
        </BucketCard>
      </div>

      <button
        type="button"
        className={`cta ${allocated >= 1 ? '' : 'cta-hidden'}`}
        onClick={onNext}
      >
        Repeat this every payday →
      </button>
    </section>
  )
}
