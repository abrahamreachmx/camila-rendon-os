import { useMemo } from 'react'
import { Link } from 'react-router'
import { PAYMENT_STATUS_STYLE } from '@/components/data/StatusBadge'
import { diffDaysIso, formatDateShort, type IsoDate } from '@/lib/dates'
import { formatMoney, formatMoneyShort, round2, type Currency } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { PaymentStatus, PaymentWithCampaign } from '@/types'

const HORIZON_DAYS = 90
const CURRENCY_ORDER: Currency[] = ['MXN', 'USD', 'COP']

/**
 * Línea de cobros: los próximos 90 días en un eje horizontal, una fila por
 * moneda. Es el único elemento con carácter de la app; todo lo demás es sobrio.
 * Los vencidos se anclan a la izquierda del eje, antes de "hoy", porque son
 * justo lo que no debe perderse de vista.
 */
export function PaymentTimeline({
  today,
  upcoming,
  overdue,
}: {
  today: IsoDate
  upcoming: PaymentWithCampaign[]
  overdue: PaymentWithCampaign[]
}) {
  const rows = useMemo(() => {
    // Una moneda merece su fila si tiene cobros futuros O algo vencido: un
    // vencido sin cobros por venir es justo el que no puede desaparecer del eje.
    const byCurrency = new Map<Currency, PaymentWithCampaign[]>()
    for (const payment of upcoming) {
      const currency = payment.campaign.currency as Currency
      byCurrency.set(currency, [...(byCurrency.get(currency) ?? []), payment])
    }
    const withOverdue = new Set(overdue.map((payment) => payment.campaign.currency as Currency))
    return CURRENCY_ORDER.filter(
      (currency) => byCurrency.has(currency) || withOverdue.has(currency),
    ).map((currency) => ({
      currency,
      payments: byCurrency.get(currency) ?? [],
      overdue: overdue.filter((payment) => payment.campaign.currency === currency),
    }))
  }, [upcoming, overdue])

  const weeks = useMemo(
    () => Array.from({ length: HORIZON_DAYS / 7 + 1 }, (_, index) => index * 7),
    [],
  )

  if (rows.length === 0 && overdue.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center text-ink-muted">
        No hay cobros programados en los próximos 90 días.
      </div>
    )
  }

  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
        <h2 className="font-heading text-[20px]">Línea de cobros</h2>
        <p className="text-[13px] text-ink-muted">
          Hoy → {formatDateShort(addDays(today, HORIZON_DAYS))} · {upcoming.length} cobro
          {upcoming.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px] px-4 pt-6 pb-2 sm:px-5">
          {rows.map(({ currency, payments, overdue: overdueRow }) => (
            <TimelineRow
              key={currency}
              currency={currency}
              today={today}
              payments={payments}
              overdue={overdueRow}
              weeks={weeks}
            />
          ))}

          <div className="relative ml-[84px] h-6">
            {weeks.map((day) => (
              <span
                key={day}
                className="absolute -translate-x-1/2 text-[11px] whitespace-nowrap text-ink-muted"
                style={{ left: `${(day / HORIZON_DAYS) * 100}%` }}
              >
                {day === 0 ? 'Hoy' : formatDateShort(addDays(today, day))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TimelineRow({
  currency,
  today,
  payments,
  overdue,
  weeks,
}: {
  currency: Currency
  today: IsoDate
  payments: PaymentWithCampaign[]
  overdue: PaymentWithCampaign[]
  weeks: number[]
}) {
  const overdueTotal = round2(overdue.reduce((acc, payment) => acc + Number(payment.amount), 0))

  return (
    <div className="mb-2 flex items-stretch gap-3">
      <div className="flex w-[72px] shrink-0 flex-col justify-center">
        <span className="text-[13px] font-semibold">{currency}</span>
        {overdue.length > 0 && (
          <span className="text-[11px] text-overdue">
            {formatMoneyShort(overdueTotal, currency)} vencido
          </span>
        )}
      </div>

      <div className="relative min-h-[86px] flex-1 border-l-2 border-plum">
        {/* rejilla de semanas */}
        {weeks.map((day) => (
          <span
            key={day}
            aria-hidden
            className={cn('absolute inset-y-0 w-px', day === 0 ? 'bg-transparent' : 'bg-line')}
            style={{ left: `${(day / 90) * 100}%` }}
          />
        ))}

        {overdue.length > 0 && (
          <span
            className="absolute top-1/2 -left-2 size-3 -translate-y-1/2 rounded-full bg-overdue ring-4 ring-overdue/20"
            title={`${overdue.length} cobro(s) vencido(s)`}
          />
        )}

        {payments.map((payment, index) => {
          const day = Math.max(0, Math.min(90, diffDaysIso(today, payment.due_date)))
          const style = PAYMENT_STATUS_STYLE[payment.status as PaymentStatus]
          // alternar arriba/abajo para que las etiquetas no se encimen
          const above = index % 2 === 0
          return (
            <Link
              key={payment.id}
              to={`/campanas/${payment.campaign.id}`}
              className="group absolute -translate-x-1/2"
              style={{ left: `${(day / 90) * 100}%`, top: above ? '8px' : '46px' }}
              title={`${payment.campaign.company?.name ?? ''} · ${payment.campaign.name}`}
            >
              <span className="flex flex-col items-center gap-1">
                <span
                  className="size-2.5 rounded-full ring-4 transition-transform group-hover:scale-125"
                  style={{ backgroundColor: style.color, ['--tw-ring-color' as string]: `${style.color}33` }}
                />
                <span className="rounded-sm bg-surface px-1 text-center text-[11px] whitespace-nowrap">
                  <span className="block font-semibold tabular-nums">
                    {formatMoneyShort(Number(payment.amount), currency)}
                  </span>
                  <span className="block max-w-[92px] truncate text-ink-muted">
                    {payment.campaign.company?.name ?? payment.campaign.name}
                  </span>
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function addDays(iso: IsoDate, days: number): IsoDate {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function timelineTotal(payments: PaymentWithCampaign[], currency: Currency): string {
  const total = round2(
    payments
      .filter((payment) => payment.campaign.currency === currency)
      .reduce((acc, payment) => acc + Number(payment.amount), 0),
  )
  return formatMoney(total, currency)
}
