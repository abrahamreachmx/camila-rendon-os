import { Link } from 'react-router'
import { PAYMENT_STATUS_STYLE } from '@/components/data/StatusBadge'
import { isOverdue, todayIso, type IsoDate } from '@/lib/dates'
import { formatAmountShort, formatMoney, type Currency } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { PaymentStatus, PaymentWithCampaign } from '@/types'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Más cobros que esto en un día y el resto se resume en una línea. */
const MAX_PER_DAY = 3

/**
 * Rejilla mensual de cobros. Cada pago muestra su moneda de forma explícita
 * porque en español los pesos y los dólares se formatean casi igual y Ana
 * necesita saber en qué va a recibir cada entrada.
 */
export function PaymentsCalendar({
  year,
  month,
  payments,
}: {
  year: number
  month: number
  payments: PaymentWithCampaign[]
}) {
  const today = todayIso()
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  // getDay() da domingo=0; la semana aquí empieza en lunes.
  const leading = (first.getDay() + 6) % 7

  const byDay = new Map<string, PaymentWithCampaign[]>()
  for (const payment of payments) {
    byDay.set(payment.due_date, [...(byDay.get(payment.due_date) ?? []), payment])
  }

  const cells: (IsoDate | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => iso(year, month, index + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-[12px] font-semibold text-ink-muted">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, index) => {
            const dayPayments = date ? (byDay.get(date) ?? []) : []
            const shown = dayPayments.slice(0, MAX_PER_DAY)
            const hidden = dayPayments.length - shown.length
            return (
              <div
                key={index}
                className={cn(
                  'min-h-[92px] border-r border-b border-line p-1.5 last:border-r-0',
                  date === today && 'bg-surface-2',
                  !date && 'bg-canvas/40',
                )}
              >
                {date && (
                  <>
                    <span
                      className={cn(
                        'text-[12px] tabular-nums',
                        date === today ? 'font-semibold text-plum' : 'text-ink-muted',
                      )}
                    >
                      {Number(date.slice(8))}
                    </span>
                    <div className="mt-1 space-y-1">
                      {shown.map((payment) => {
                        const overdue = isOverdue(payment.due_date, payment.status, today)
                        const style = PAYMENT_STATUS_STYLE[overdue ? 'vencido' : (payment.status as PaymentStatus)]
                        const currency = payment.campaign.currency as Currency
                        const amount = Number(payment.amount)
                        return (
                          <Link
                            key={payment.id}
                            to={`/campanas/${payment.campaign.id}`}
                            title={`${payment.campaign.company?.name ?? ''} · ${payment.campaign.name} · ${formatMoney(amount, currency)} ${currency} · ${style.label}`}
                            className="flex items-center gap-1 rounded-sm px-1 py-0.5 text-[11px] hover:bg-surface-2"
                          >
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: style.color }}
                              aria-hidden
                            />
                            <span className="truncate tabular-nums">
                              {formatAmountShort(amount, currency)}
                            </span>
                            <span className="shrink-0 text-[10px] font-semibold text-ink-muted">
                              {currency}
                            </span>
                          </Link>
                        )
                      })}
                      {hidden > 0 && (
                        <Link
                          to={`/cobros?anio=${year}&mes=${month}`}
                          className="block rounded-sm px-1 py-0.5 text-[11px] text-ink-muted underline-offset-2 hover:bg-surface-2 hover:underline"
                        >
                          y {hidden} más
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function iso(year: number, month: number, day: number): IsoDate {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
