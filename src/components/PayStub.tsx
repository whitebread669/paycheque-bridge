import type { ReactNode } from 'react'
import { Money } from './CountUp'
import { formatMoney } from '../lib/engine'

export interface StubLine {
  label: string
  amount: number
  kind?: 'earn' | 'deduct' | 'bonus' | 'zero'
  color?: string
  reveal?: ReactNode
  revealed?: boolean
}

export function PayStub({
  title,
  subtitle,
  lines,
  netLabel,
  net,
  dim,
  footer,
}: {
  title: string
  subtitle: string
  lines: StubLine[]
  netLabel: string
  net: number
  dim?: boolean
  footer?: ReactNode
}) {
  return (
    <div className={`paystub ${dim ? 'paystub-dim' : ''}`}>
      <div className="paystub-perforation" />
      <div className="paystub-head">
        <div className="paystub-brand">CALGARYMONEY.COM</div>
        <div className="paystub-title">{title}</div>
        <div className="paystub-subtitle">{subtitle}</div>
      </div>
      <div className="paystub-lines">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`stub-line stub-${line.kind ?? 'earn'} ${line.revealed ? 'stub-revealed' : ''}`}
          >
            <div className="stub-row">
              <span className="stub-label">{line.label}</span>
              <span className="stub-dots" />
              <span
                className="num stub-amount"
                style={line.color ? { color: line.color } : undefined}
              >
                {line.kind === 'deduct' ? '−' : line.kind === 'bonus' ? '+' : ''}
                {formatMoney(Math.abs(line.amount))}
              </span>
            </div>
            {line.reveal && line.revealed ? (
              <div className="stub-reveal">{line.reveal}</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="paystub-net">
        <span>{netLabel}</span>
        <Money value={net} dec={2} className="paystub-net-amount" />
      </div>
      {footer ? <div className="paystub-footer">{footer}</div> : null}
    </div>
  )
}
