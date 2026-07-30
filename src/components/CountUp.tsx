import { useCountUp } from '../hooks/useCountUp'
import { formatMoney, formatNumber } from '../lib/engine'

export function Money({
  value,
  dec = 2,
  className,
}: {
  value: number
  dec?: number
  className?: string
}) {
  const n = useCountUp(value)
  return <span className={`num ${className ?? ''}`}>{formatMoney(n, dec)}</span>
}

export function Count({
  value,
  dec = 1,
  suffix = '',
  className,
}: {
  value: number
  dec?: number
  suffix?: string
  className?: string
}) {
  const n = useCountUp(value)
  return (
    <span className={`num ${className ?? ''}`}>
      {formatNumber(n, dec)}
      {suffix}
    </span>
  )
}
