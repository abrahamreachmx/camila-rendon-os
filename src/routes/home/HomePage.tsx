import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { StatusBadge } from '@/components/data/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { getHomeData } from '@/lib/api/home'
import { formatDateLong, formatDateShort } from '@/lib/dates'
import { formatMoney, type Currency } from '@/lib/money'
import { cn } from '@/lib/utils'
import { PaymentTimeline } from '@/routes/home/PaymentTimeline'
import type { CampaignListRow } from '@/types'

export default function HomePage() {
  const { data, isPending } = useQuery({ queryKey: ['home'], queryFn: getHomeData })

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

      <PaymentTimeline today={data.today} upcoming={data.upcomingPayments} overdue={data.overduePayments} />

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

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <CampaignList
          title="Entregas de contenido"
          empty="Nada por entregar en las próximas dos semanas."
          campaigns={data.contentDue}
          dateOf={(campaign) => campaign.content_due_date}
        />
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
