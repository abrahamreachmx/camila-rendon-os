import { Link } from 'react-router'
import { PAYMENT_STATUS_STYLE } from '@/components/data/StatusBadge'
import { isOverdue, todayIso, type IsoDate } from '@/lib/dates'
import { formatMoneyShort, type Currency } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { PaymentStatus, PaymentWithCampaign } from '@/types'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Rejilla mensual: cada día muestra sus cobros con un punto del color de su estatus. */
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
                      {dayPayments.map((payment) => {
                        const overdue = isOverdue(payment.due_date, payment.status, today)
                        const style = PAYMENT_STATUS_STYLE[overdue ? 'vencido' : (payment.status as PaymentStatus)]
                        return (
                          <Link
                            key={payment.id}
                            to={`/campanas/${payment.campaign.id}`}
                            title={`${payment.campaign.company?.name ?? ''} · ${payment.campaign.name}`}
                            className="flex items-center gap-1 rounded-sm px-1 py-0.5 text-[11px] hover:bg-surface-2"
                          >
                            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: style.color }} />
                            <span className="truncate tabular-nums">
                              {formatMoneyShort(Number(payment.amount), payment.campaign.currency as Currency)}
                            </span>
                          </Link>
                        )
                      })}
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
