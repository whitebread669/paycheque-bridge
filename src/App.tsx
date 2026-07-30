import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Act, AppState } from './lib/types'
import { createInitialState } from './lib/defaults'
import { deriveAll } from './lib/engine'
import { ProgressRail } from './components/ProgressRail'
import { CounterBar } from './components/CounterBar'
import { AssumptionsPanel } from './components/AssumptionsPanel'
import { Act1 } from './components/Act1'
import { Act2 } from './components/Act2'
import { Act3 } from './components/Act3'
import { Act5 } from './components/Act5'

interface Toast {
  id: number
  text: string
}

export default function App() {
  const [state, setState] = useState<AppState>(createInitialState)
  const [act2Days, setAct2Days] = useState(0)
  const [showAssumptions, setShowAssumptions] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)
  const prevRef = useRef<{ days: number; goGo: number } | null>(null)

  const derived = useMemo(() => deriveAll(state), [state])

  const days =
    state.act === 2
      ? act2Days
      : state.act === 1
        ? 0
        : derived.daysPerPaycheque

  const patch = useCallback(
    (p: Partial<AppState> | ((s: AppState) => AppState)) => {
      setState((s) => (typeof p === 'function' ? p(s) : { ...s, ...p }))
    },
    [],
  )

  const go = (act: Act) => setState((s) => ({ ...s, act }))

  const reset = () => {
    setState(createInitialState())
    setAct2Days(0)
    prevRef.current = null
  }

  // Act 4: toast on live counter changes during Act 3
  useEffect(() => {
    if (state.act !== 3) {
      prevRef.current = {
        days: derived.daysPerPaycheque,
        goGo: derived.health.funded,
      }
      return
    }
    const prev = prevRef.current
    if (!prev) {
      prevRef.current = {
        days: derived.daysPerPaycheque,
        goGo: derived.health.funded,
      }
      return
    }
    const dDays = derived.daysPerPaycheque - prev.days
    const dGo = derived.health.funded - prev.goGo
    const parts: string[] = []
    if (Math.abs(dDays) >= 0.05) {
      parts.push(
        `${dDays >= 0 ? '+' : ''}${dDays.toFixed(1)} retirement days`,
      )
    }
    if (Math.abs(dGo) >= 0.05) {
      parts.push(`go-go years funded → ${derived.health.funded.toFixed(1)}`)
    }
    if (parts.length) {
      const id = ++toastId.current
      setToasts((t) => [...t.slice(-2), { id, text: parts.join(' · ') }])
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, 1800)
    }
    prevRef.current = {
      days: derived.daysPerPaycheque,
      goGo: derived.health.funded,
    }
  }, [derived.daysPerPaycheque, derived.health.funded, state.act])

  return (
    <div className="app">
      <ProgressRail act={state.act} onJump={go} />

      {(state.act === 2 || state.act === 3 || state.act === 5) && (
        <CounterBar
          days={days}
          goGoFunded={derived.health.funded}
          goGoTotal={derived.health.total}
          monthlyIncome={derived.projectedMonthlyIncome}
          showExtra={state.act === 3 || state.act === 5}
          onAssumptions={() => setShowAssumptions(true)}
        />
      )}

      <main>
        {state.act === 1 && (
          <Act1 state={state} onNext={() => go(2)} />
        )}
        {state.act === 2 && (
          <Act2
            state={state}
            onNext={() => go(3)}
            onDays={setAct2Days}
          />
        )}
        {state.act === 3 && (
          <Act3
            state={state}
            setState={setState}
            onNext={() => go(5)}
          />
        )}
        {state.act === 5 && (
          <Act5
            state={state}
            onBack={() => go(3)}
            onReset={reset}
            onAssumptions={() => setShowAssumptions(true)}
          />
        )}
      </main>

      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>

      <footer className="disclaimer">
        Educational demo for the Cursor Hackathon. Estimates in today’s dollars
        using simplified assumptions (see Assumptions). Not financial advice.
        CPP/OAS figures: Government of Canada, 2026.
      </footer>

      {showAssumptions ? (
        <AssumptionsPanel
          state={state}
          onChange={patch}
          onClose={() => setShowAssumptions(false)}
        />
      ) : null}
    </div>
  )
}
