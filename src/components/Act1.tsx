import type { AppState } from '../lib/types'
import { PayStub } from './PayStub'

export function Act1({
  state,
  onNext,
}: {
  state: AppState
  onNext: () => void
}) {
  const a = state.assumptions
  const net = a.cppAverage + a.oasAt65
  const year = new Date().getFullYear() + (65 - state.currentAge)

  return (
    <section className="act act1">
      <div className="act-kicker">PAYDAY, {year}</div>
      <PayStub
        title="RETIREMENT PAY STATEMENT"
        subtitle={`Employee: You, age 65 · ${year} · if nothing changes`}
        lines={[
          { label: 'CPP retirement pension (average)', amount: a.cppAverage },
          { label: 'Old Age Security', amount: a.oasAt65 },
          { label: 'Your savings', amount: 0, kind: 'zero' },
        ]}
        netLabel="NET MONTHLY INCOME"
        net={net}
        dim
        footer={
          <span>
            When the paycheque stops, this is what replaces it — unless today changes
            something.
          </span>
        }
      />
      <button type="button" className="cta" onClick={onNext}>
        ⟲ Rewind to today
      </button>
      <p className="act-note">
        Figures: Government of Canada, 2026 · today’s dollars
      </p>
    </section>
  )
}
