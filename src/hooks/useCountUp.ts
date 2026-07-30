import { useEffect, useRef, useState } from 'react'

/** Animate a number from its previous value to `value` over ~600ms (cubic ease-out). */
export function useCountUp(value: number, duration = 600): number {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const raf = useRef(0)

  useEffect(() => {
    const from = prev.current
    if (from === value) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (value - from) * eased)
      if (t < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        prev.current = value
      }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return display
}
