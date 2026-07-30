import { useMemo, useState } from 'react'
import type { TickerId } from '../lib/engine'
import { generateSeries } from '../lib/tickers'

export function Sparkline({
  tickerId,
  width = 120,
  height = 36,
  stroke = '#059669',
  big = false,
}: {
  tickerId: TickerId
  width?: number
  height?: number
  stroke?: string
  big?: boolean
}) {
  const series = useMemo(() => generateSeries(tickerId), [tickerId])
  const [hover, setHover] = useState(false)
  const prices = series.prices
  const min = Math.min(...prices)
  const range = Math.max(...prices) - min || 1
  const w = hover ? 280 : width
  const h = hover ? 120 : height
  const points = prices
    .map(
      (p, i) =>
        `${(i / (prices.length - 1)) * w},${h - 3 - ((p - min) / range) * (h - 6)}`,
    )
    .join(' ')
  const up = prices[prices.length - 1]! >= prices[0]!
  const color = big || up ? stroke : '#DC2626'
  const ret = series.totalReturn * 100

  return (
    <div
      className={`spark-wrap ${hover ? 'spark-hover' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <svg width={w} height={h} className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={big || hover ? 2 : 1.5}
          strokeLinejoin="round"
        />
      </svg>
      {hover ? (
        <div className="spark-tip">
          1-year total return:{' '}
          <strong className={ret >= 0 ? 'pos' : 'neg'}>
            {ret >= 0 ? '+' : ''}
            {ret.toFixed(1)}%
          </strong>
        </div>
      ) : null}
    </div>
  )
}
