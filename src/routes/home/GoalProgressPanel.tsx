import { Link } from 'react-router'
import { readableTextColor } from '@/lib/contrast'
import { type IsoDate } from '@/lib/dates'
import { goalProgress, targetForRange, type SalesGoal } from '@/lib/goals'
import { formatMoney } from '@/lib/money'
import { type PeriodRange } from '@/lib/periods'
import { cn } from '@/lib/utils'

// El ámbar y el verde del §7 están pensados para el tinte al 12 % de un badge.
// Aquí el porcentaje va como texto de 13 px sobre superficie blanca, donde el
// ámbar sólo llega a 3.03:1, por debajo del 4.5:1 que pide WCAG AA. Se oscurecen
// con el mismo helper del badge, midiendo contra blanco.
const WHITE: [number, number, number] = [255, 255, 255]
const ON_TRACK_TEXT = readableTextColor('#3E7C5A', { tintAlpha: 0, surface: WHITE })
const BEHIND_TEXT = readableTextColor('#C08A2E', { tintAlpha: 0, surface: WHITE })

/**
 * Avance contra la meta del mes y del trimestre. La cifra grande es lo vendido;
 * la meta es el contexto. La marca vertical de la barra dice dónde debería ir
 * hoy si el ritmo fuera parejo: es lo que convierte la barra en información.
 */
export function GoalProgressPanel({
  goals,
  month,
  quarter,
  today,
}: {
  goals: SalesGoal[]
  month: { range: PeriodRange; actual: number }
  quarter: { range: PeriodRange; actual: number }
  today: IsoDate
}) {
  return (
    <section
      aria-label="Avance contra la meta"
      className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2"
    >
      <GoalCell title={monthTitle(month.range)} goals={goals} {...month} today={today} noun="el mes" />
      <GoalCell title={`Meta de ${quarter.range.label}`} goals={goals} {...quarter} today={today} noun="el trimestre" />
    </section>
  )
}

function GoalCell({
  title,
  goals,
  range,
  actual,
  today,
  noun,
}: {
  title: string
  goals: SalesGoal[]
  range: PeriodRange
  actual: number
  today: IsoDate
  noun: string
}) {
  const target = targetForRange(goals, range)

  if (target === null) {
    return (
      <div className="bg-surface px-4 py-4">
        <p className="text-[13px] text-ink-muted">{title}</p>
        <p className="mt-1 text-[15px]">Sin meta para {range.from.slice(0, 4)}.</p>
        <Link
          to="/configuracion"
          className="mt-1 inline-block text-[13px] text-plum underline underline-offset-2"
        >
          Definir la meta
        </Link>
      </div>
    )
  }

  const p = goalProgress({ target, actual, range, today })
  const reached = p.pct >= 100
  const closed = p.daysLeft === 0

  return (
    <div className="bg-surface px-4 py-4">
      <p className="text-[13px] text-ink-muted">{title}</p>
      <p className="mt-1 font-heading text-[28px] leading-tight tabular-nums">
        {formatMoney(p.actual, 'MXN')}
      </p>
      <p className="mt-0.5 text-[13px] text-ink-muted">
        de {formatMoney(p.target, 'MXN')} ·{' '}
        <span className="font-semibold" style={{ color: p.onTrack ? ON_TRACK_TEXT : BEHIND_TEXT }}>
          {p.pct} %
        </span>
      </p>

      <div className="relative mt-3">
        <div
          role="progressbar"
          aria-valuenow={Math.round(p.pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Avance de ${title}`}
          className="h-2 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] motion-reduce:transition-none',
              reached ? 'bg-paid' : 'bg-plum',
            )}
            style={{ width: `${Math.min(p.pct, 100)}%` }}
          />
        </div>
        {p.target > 0 && !closed && (
          <span
            className="absolute top-0 h-2 w-px bg-ink-muted"
            style={{ left: `${Math.min((p.expectedToDate / p.target) * 100, 100)}%` }}
            aria-hidden
          >
            <span className="sr-only">Ritmo parejo al día de hoy</span>
          </span>
        )}
      </div>

      <p className="mt-2 text-[13px] text-ink-muted">
        {reached
          ? `Meta cumplida. ${formatMoney(p.surplus, 'MXN')} por encima.`
          : closed
            ? `${capitalize(noun)} cerró ${formatMoney(p.remaining, 'MXN')} abajo de la meta.`
            : p.onTrack
              ? `Faltan ${formatMoney(p.remaining, 'MXN')} · vas ${formatMoney(p.actual - p.expectedToDate, 'MXN')} arriba del ritmo.`
              : `Faltan ${formatMoney(p.remaining, 'MXN')} · ${formatMoney(p.paceNeeded, 'MXN')} diarios para cerrar ${noun}.`}
      </p>
    </div>
  )
}

/** "Meta de septiembre": el mes sin el año, que ya se entiende por contexto. */
function monthTitle(range: PeriodRange): string {
  return `Meta de ${range.label.replace(/\s\d{4}$/, '').toLowerCase()}`
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
