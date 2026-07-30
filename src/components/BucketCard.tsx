import type { ReactNode } from 'react'
import { Money } from './CountUp'

export function BucketCard({
  name,
  tag,
  color,
  alloc,
  onAlloc,
  max,
  children,
}: {
  name: string
  tag: string
  color: string
  alloc: number
  onAlloc: (n: number) => void
  max: number
  children: ReactNode
}) {
  return (
    <div className="bucket" style={{ borderTopColor: color }}>
      <div className="bucket-head">
        <div>
          <div className="bucket-name" style={{ color }}>
            {name}
          </div>
          <div className="bucket-tag">{tag}</div>
        </div>
        <Money value={alloc} className="bucket-alloc" />
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={10}
        value={Math.min(alloc, max)}
        onChange={(e) => onAlloc(Number(e.target.value))}
        className="bucket-slider"
        style={{ accentColor: color }}
      />
      <div className="bucket-direct">
        <input
          type="number"
          min={0}
          max={max}
          step={10}
          value={Math.round(alloc)}
          onChange={(e) => onAlloc(Number(e.target.value))}
          aria-label={`${name} allocation`}
        />
      </div>
      <div className="bucket-body">{children}</div>
    </div>
  )
}
