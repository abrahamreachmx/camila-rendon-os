import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { MonthlyIncomeSummary } from '@/components/data/MonthlyIncomeSummary'
import { PaymentsCalendar } from '@/components/data/PaymentsCalendar'
import { StatusBadge } from '@/components/data/StatusBadge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { getHomeData } from '@/lib/api/home'
import { listPendingDeliverables } from '@/lib/api/deliverables'
import { listPayments } from '@/lib/api/payments'
import { getReportSummary } from '@/lib/api/reports'
import { getSettings, readSalesGoals } from '@/lib/api/settings'
import { formatDateLong, formatDateShort } from '@/lib/dates'
import { formatMoney, type Currency } from '@/lib/money'
import { currentMonth, currentQuarter, monthRange } from '@/lib/periods'
import { cn } from '@/lib/utils'
import { GoalProgressPanel } from '@/routes/home/GoalProgressPanel'
import { deliverableLabel } from '@/lib/deliverables'
import { isOverdue } from '@/lib/dates'
import type { CampaignListRow, DeliverableWithCampaign } from '@/types'

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const now = new Date()
  const year = Number(params.get('anio') ?? now.getFullYear())
  const month = Number(params.get('mes') ?? now.getMonth() + 1)
  const range = monthRange(year, month)
  const view = params.get('vista') === 'resumen' ? 'resumen' : 'calendario'

  const { data, isPending } = useQuery({ queryKey: ['home'], queryFn: getHomeData })
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', { from: range.from, to: range.to }],
    queryFn: () => listPayments({ from: range.from, to: range.to }),
  })

  // El avance contra la meta: la configuración ya está cacheada en media app y
  // el resumen del trimestre comparte clave con Reportes. El desglose mensual
  // que trae ese mismo resumen evita una tercera consulta.
  const quarter = useMemo(() => currentQuarter(), [])
  const thisMonth = useMemo(() => currentMonth(), [])
  const { data: deliverables = [] } = useQuery({
    queryKey: ['deliverables', 'pending'],
    queryFn: listPendingDeliverables,
  })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: report } = useQuery({
    queryKey: ['report', quarter.from, quarter.to],
    queryFn: () => getReportSummary(quarter.from, quarter.to),
  })

  function setView(next: 'calendario' | 'resumen') {
    const params2 = new URLSearchParams(params)
    if (next === 'resumen') params2.set('vista', 'resumen')
    else params2.delete('vista')
    setParams(params2, { replace: true })
  }

  /** Mueve el calendario de mes guardando la posición en la URL, igual que Cobros. */
  function move(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    const params2 = new URLSearchParams(params)
    params2.set('anio', String(next.getFullYear()))
    params2.set('mes', String(next.getMonth() + 1))
    setParams(params2, { replace: true })
  }

  if (isPending || !data) {
    return (
      <>
        <PageHeader title="Hola, Ana" />
        <LoadingRows rows={6} />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Hola, Ana" description={formatDateLong(data.today)} />

      <section aria-label="Calendario de cobros">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-[20px]">Cobros</h2>
            <div role="group" aria-label="Vista de cobros" className="inline-flex rounded-sm border border-line bg-surface p-0.5">
              {(['calendario', 'resumen'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === option}
                  onClick={() => setView(option)}
                  className={cn(
                    'rounded-sm px-3 py-1 text-[13px] transition-colors',
                    view === option ? 'bg-plum text-white' : 'text-ink hover:bg-surface-2',
                  )}
                >
                  {option === 'calendario' ? 'Calendario' : 'Resumen del mes'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => move(-1)} aria-label="Mes anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[160px] text-center text-[13px] text-ink-muted">{range.label}</span>
            <Button variant="ghost" size="icon" onClick={() => move(1)} aria-label="Mes siguiente">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {data.overduePayments.length > 0 && (
          <Link
            to="/cobros?estatus=vencido"
            className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-overdue/40 bg-overdue/5 px-4 py-2 text-[13px] text-overdue hover:bg-overdue/10"
          >
            <span className="font-semibold">
              {data.overduePayments.length === 1
                ? '1 cobro vencido'
                : `${data.overduePayments.length} cobros vencidos`}
            </span>
            <span>por {formatMoney(data.overdueMxn, 'MXN')}, de meses anteriores.</span>
            <span className="underline underline-offset-2">Ver la lista</span>
          </Link>
        )}

        {view === 'resumen' ? (
          <MonthlyIncomeSummary payments={payments} monthLabel={range.label} />
        ) : (
          <PaymentsCalendar year={year} month={month} payments={payments} />
        )}
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiTile
          label="Cobros vencidos"
          value={formatMoney(data.overdueMxn, 'MXN')}
          hint={`${data.overduePayments.length} cobro${data.overduePayments.length === 1 ? '' : 's'}`}
          tone={data.overdueMxn > 0 ? 'overdue' : 'neutral'}
          to="/cobros?estatus=vencido"
        />
        <KpiTile
          label="Por cobrar este mes"
          value={formatMoney(data.dueThisMonthMxn, 'MXN')}
          hint="Consolidado en pesos"
          to="/cobros"
        />
        <KpiTile
          label="Comisiones pendientes"
          value={formatMoney(data.pendingCommissionMxn, 'MXN')}
          hint="De campañas sin comisión pagada"
          to="/campanas"
        />
      </div>

      {settings && report && (
        <GoalProgressPanel
          goals={readSalesGoals(settings)}
          today={data.today}
          month={{
            range: thisMonth,
            // monthly_sales no rellena meses en cero: el día 1 el mes aún no viene.
            actual: Number(
              report.monthly_sales.find((m) => m.month === thisMonth.from.slice(0, 7))?.net_mxn ?? 0,
            ),
          }}
          quarter={{ range: quarter, actual: Number(report.sales.net_mxn) }}
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <DeliverableList today={data.today} items={deliverables} />
        <CampaignList
          title="Publicaciones"
          empty="Sin publicaciones programadas."
          campaigns={data.publishing}
          dateOf={(campaign) => campaign.publish_date}
        />
        <CampaignList
          title={data.inApproval.statusName}
          empty="Nada esperando aprobación."
          campaigns={data.inApproval.campaigns}
          dateOf={(campaign) => campaign.publish_date}
          showAmount
        />
      </div>
    </>
  )
}

function KpiTile({
  label, value, hint, tone = 'neutral', to,
}: {
  label: string
  value: string
  hint: string
  tone?: 'neutral' | 'overdue'
  to: string
}) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-line bg-surface px-4 py-4 transition-colors hover:border-plum"
    >
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p
        className={cn(
          'mt-1 font-heading text-[28px] leading-tight tabular-nums',
          tone === 'overdue' && 'text-overdue',
        )}
      >
        {value}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-muted">
        {hint}
        <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </p>
    </Link>
  )
}

function CampaignList({
  title, empty, campaigns, dateOf, showAmount,
}: {
  title: string
  empty: string
  campaigns: CampaignListRow[]
  dateOf: (campaign: CampaignListRow) => string | null
  showAmount?: boolean
}) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-[20px]">{title}</h2>
      {campaigns.length === 0 ? (
        <EmptyState message={empty} />
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {campaigns.slice(0, 6).map((campaign) => (
            <li key={campaign.id}>
              <Link to={`/campanas/${campaign.id}`} className="block px-4 py-3 hover:bg-surface-2">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{campaign.name}</span>
                  <span className="shrink-0 text-[13px] text-ink-muted">{formatDateShort(dateOf(campaign))}</span>
                </p>
                <p className="mt-0.5 flex items-center justify-between gap-2 text-[13px] text-ink-muted">
                  <span className="min-w-0 truncate">{campaign.company?.name ?? '—'}</span>
                  {showAmount ? (
                    <span className="shrink-0 tabular-nums">
                      {formatMoney(Number(campaign.net_amount), campaign.currency as Currency)}
                    </span>
                  ) : (
                    campaign.status && (
                      <StatusBadge label={campaign.status.name} color={campaign.status.color} />
                    )
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Las piezas por entregar, no las campañas. Ana necesita saber qué contenido
 * debe, no sólo qué campaña tiene fecha.
 */
function DeliverableList({
  today,
  items,
}: {
  today: string
  items: DeliverableWithCampaign[]
}) {
  const visibles = items
    .slice()
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
    .slice(0, 6)

  return (
    <section>
      <h2 className="mb-3 font-heading text-[20px]">Entregas de contenido</h2>
      {visibles.length === 0 ? (
        <EmptyState message="Nada por entregar." />
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {visibles.map((item) => {
            const vencida = isOverdue(item.due_date ?? '', 'pendiente', today)
            return (
              <li key={item.id}>
                <Link to={`/campanas/${item.campaign.id}`} className="block px-4 py-3 hover:bg-surface-2">
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{deliverableLabel(item)}</span>
                    <span className={cn('shrink-0 text-[13px]', vencida ? 'text-overdue' : 'text-ink-muted')}>
                      {formatDateShort(item.due_date)}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                    {item.campaign.company?.name ?? item.campaign.name}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
