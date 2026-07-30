import type { Act } from '../lib/types'

const ACTS: { id: Act; label: string }[] = [
  { id: 1, label: 'Bleak open' },
  { id: 2, label: 'The bridge' },
  { id: 3, label: 'Four buckets' },
  { id: 5, label: 'The payoff' },
]

export function ProgressRail({
  act,
  onJump,
}: {
  act: Act
  onJump: (a: Act) => void
}) {
  const order = [1, 2, 3, 5] as const
  const currentIdx = order.indexOf(act)

  return (
    <nav className="rail" aria-label="Acts">
      {ACTS.map((a, i) => {
        const done = i < currentIdx
        const on = a.id === act
        return (
          <button
            key={a.id}
            type="button"
            className={`rail-dot ${done ? 'done' : ''} ${on ? 'on' : ''}`}
            onClick={() => {
              if (done || on) onJump(a.id)
            }}
            aria-label={a.label}
            aria-current={on ? 'step' : undefined}
          >
            <span>{a.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
