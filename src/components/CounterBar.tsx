import { Count, Money } from './CountUp'

export function CounterBar({
  days,
  goGoFunded,
  goGoTotal,
  monthlyIncome,
  showExtra,
  onAssumptions,
}: {
  days: number
  goGoFunded: number
  goGoTotal: number
  monthlyIncome: number
  showExtra: boolean
  onAssumptions: () => void
}) {
  return (
    <div className="counterbar">
      <div className="counter">
        <span className="counter-label">Retirement days earned this paycheque</span>
        <Count value={days} className="gold counter-num" />
      </div>
      {showExtra ? (
        <>
          <div className="counter">
            <span className="counter-label">Go-go years funded</span>
            <span className="counter-num">
              <Count value={goGoFunded} dec={1} />
              <span className="counter-soft"> / {goGoTotal.toFixed(0)}</span>
            </span>
          </div>
          <div className="counter">
            <span className="counter-label">Projected monthly income</span>
            <Money value={monthlyIncome} dec={0} className="counter-num" />
          </div>
        </>
      ) : null}
      <button
        type="button"
        className="gear"
        onClick={onAssumptions}
        title="Assumptions"
        aria-label="Open assumptions"
      >
        ⚙
      </button>
    </div>
  )
}
