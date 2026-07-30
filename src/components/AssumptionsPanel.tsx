import type { AppState, Assumptions } from '../lib/types'
import { DEFAULT_ASSUMPTIONS } from '../lib/engine'

export function AssumptionsPanel({
  state,
  onChange,
  onClose,
}: {
  state: AppState
  onChange: (patch: Partial<AppState> | ((s: AppState) => AppState)) => void
  onClose: () => void
}) {
  const a = state.assumptions

  const setA = (key: keyof Assumptions, value: number) => {
    onChange({ assumptions: { ...a, [key]: value } })
  }

  const rows: {
    label: string
    note: string
    value: number
    onChange: (v: number) => void
    step?: number
  }[] = [
    {
      label: 'Gross pay / paycheque $',
      note: 'semi-monthly default $5,000',
      value: state.grossPerPaycheque,
      onChange: (v) => onChange({ grossPerPaycheque: v }),
      step: 100,
    },
    {
      label: 'Paycheques / year',
      note: '24 = semi-monthly',
      value: state.paychequesPerYear,
      onChange: (v) => onChange({ paychequesPerYear: v }),
    },
    {
      label: 'Fixed costs / paycheque $',
      note: 'leaves the discretionary pool',
      value: state.fixedCostsPerPaycheque,
      onChange: (v) => onChange({ fixedCostsPerPaycheque: v }),
      step: 10,
    },
    {
      label: 'Current age',
      note: 'years of compounding left',
      value: state.currentAge,
      onChange: (v) => onChange({ currentAge: v }),
    },
    {
      label: 'Real return %',
      note: 'inflation-adjusted; today’s dollars',
      value: a.defaultRealReturn * 100,
      onChange: (v) => setA('defaultRealReturn', v / 100),
      step: 0.5,
    },
    {
      label: 'Annuity payout rate %',
      note: 'income bucket at 65',
      value: a.payoutRate * 100,
      onChange: (v) => setA('payoutRate', v / 100),
      step: 0.25,
    },
    {
      label: 'Cost of one retirement day $',
      note: '≈ $3,600/mo comfortable',
      value: a.dailySpend,
      onChange: (v) => setA('dailySpend', v),
      step: 5,
    },
    {
      label: 'Extra go-go spend $/yr',
      note: 'travel & activity above baseline',
      value: a.goGoExtraSpend,
      onChange: (v) => setA('goGoExtraSpend', v),
      step: 500,
    },
    {
      label: 'CPP average at 65 $',
      note: 'Service Canada 2026',
      value: a.cppAverage,
      onChange: (v) => setA('cppAverage', v),
      step: 10,
    },
    {
      label: 'CPP maximum at 65 $',
      note: '2026 max monthly',
      value: a.cppMaxAt65,
      onChange: (v) => setA('cppMaxAt65', v),
      step: 10,
    },
    {
      label: 'OAS at 65 $',
      note: '65–74; ignore 75+ bump',
      value: a.oasAt65,
      onChange: (v) => setA('oasAt65', v),
    },
    {
      label: 'OAS clawback threshold $/yr',
      note: '15% of income above this',
      value: a.oasClawbackThreshold,
      onChange: (v) => setA('oasClawbackThreshold', v),
      step: 1000,
    },
    {
      label: 'Unallocated growth cash %',
      note: 'cash waiting to be invested',
      value: a.unallocatedGrowthReturn * 100,
      onChange: (v) => setA('unallocatedGrowthReturn', v / 100),
      step: 0.25,
    },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Assumptions</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="modal-note">
          All rates are <strong>real</strong> (inflation-adjusted). Every figure is
          in today’s dollars. Edit anything — the demo recomputes live.
        </p>
        <div className="modal-rows">
          {rows.map((r) => (
            <label key={r.label} className="modal-row">
              <span>
                {r.label}
                <em>{r.note}</em>
              </span>
              <input
                type="number"
                step={r.step ?? 1}
                value={Number(r.value.toFixed(4))}
                onChange={(e) => r.onChange(Number(e.target.value))}
              />
            </label>
          ))}
          <label className="modal-row">
            <span>
              CPP tier
              <em>average / above average / maximum</em>
            </span>
            <select
              value={state.cppTier}
              onChange={(e) =>
                onChange({ cppTier: e.target.value as AppState['cppTier'] })
              }
              style={{
                width: 140,
                background: '#0f1b2d',
                color: '#e8ecf4',
                border: '1px solid #3a4d70',
                borderRadius: 6,
                padding: '6px 8px',
              }}
            >
              <option value="average">Average</option>
              <option value="aboveAverage">Above avg</option>
              <option value="maximum">Maximum</option>
            </select>
          </label>
        </div>
        <p className="modal-note small">
          Simplifications: CPP mid-year contribution cap ignored; ~39 max years earn
          max pension; OAS 75+ bump ignored; no sequence-of-returns risk modelled.
        </p>
        <div className="act5-actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="cta ghost"
            onClick={() =>
              onChange({
                assumptions: { ...DEFAULT_ASSUMPTIONS },
                grossPerPaycheque: 5000,
                paychequesPerYear: 24,
                fixedCostsPerPaycheque: 2307,
                currentAge: 35,
                cppTier: 'average',
              })
            }
          >
            Reset assumptions
          </button>
          <button type="button" className="cta" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
