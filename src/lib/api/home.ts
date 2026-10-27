import { listMonthPayments, PAYMENT_WITH_CAMPAIGN as PAYMENT_SELECT } from '@/lib/api/payments'
import { summarizeMonthIncome } from '@/lib/collection'
import { addDaysIso, todayIso, type IsoDate } from '@/lib/dates'
import { unwrap } from '@/lib/errors'
import { round2, toMxn } from '@/lib/money'
import { supabase } from '@/lib/supabase'
import type { CampaignListRow, PaymentWithCampaign } from '@/types'

const CAMPAIGN_SELECT =
  '*, company:companies(id, name), status:campaign_statuses(id, name, color, is_closed)'

export type HomeData = {
  today: IsoDate
  /** Los cobros vencidos de meses anteriores no caben en la rejilla del mes, se avisan aparte. */
  overduePayments: PaymentWithCampaign[]
  overdueMxn: number
  /** Lo que falta cobrar con fecha hasta fin de mes, vencidos incluidos. */
  dueThisMonthMxn: number
  /** Comisión aún no pagada sobre lo que entra este mes. */
  pendingCommissionMxn: number
  contentDue: CampaignListRow[]
  publishing: CampaignListRow[]
  inApproval: { statusName: string; campaigns: CampaignListRow[] }
}

/** Todo lo que necesita el Inicio en una sola pasada. */
export async function getHomeData(): Promise<HomeData> {
  const today = todayIso()
  const horizon = addDaysIso(today, 90)
  const monthStart = `${today.slice(0, 7)}-01`
  const monthEnd = lastDayOfMonth(today)
  const inTwoWeeks = addDaysIso(today, 14)

  const [overdue, monthDue, openCampaigns, statuses] = await Promise.all([
    supabase
      .from('payment_schedules')
      .select(PAYMENT_SELECT)
      .neq('status', 'pagado')
      .lt('due_date', today)
      .order('due_date'),
    listMonthPayments(monthStart, monthEnd),
    supabase.from('campaigns').select(CAMPAIGN_SELECT).order('created_at', { ascending: false }),
    supabase.from('campaign_statuses').select('*'),
  ])

  const overduePayments = unwrap(overdue) as unknown as PaymentWithCampaign[]
  const month = summarizeMonthIncome(monthDue, today)
  const campaigns = unwrap(openCampaigns) as unknown as CampaignListRow[]
  const allStatuses = unwrap(statuses)

  const defaultStatus = allStatuses.find((status) => status.is_default) ?? null

  return {
    today,
    overduePayments,
    overdueMxn: sumMxn(overduePayments),
    dueThisMonthMxn: month.mxn.pending,
    pendingCommissionMxn: month.commissionPendingMxn,
    contentDue: campaigns
      .filter(
        (campaign) =>
          !campaign.produced &&
          campaign.content_due_date !== null &&
          campaign.content_due_date <= inTwoWeeks,
      )
      .sort((a, b) => (a.content_due_date ?? '').localeCompare(b.content_due_date ?? '')),
    publishing: campaigns
      .filter(
        (campaign) =>
          campaign.publish_date !== null &&
          campaign.publish_date >= today &&
          campaign.publish_date <= horizon,
      )
      .sort((a, b) => (a.publish_date ?? '').localeCompare(b.publish_date ?? '')),
    inApproval: {
      statusName: defaultStatus?.name ?? 'Abiertas',
      campaigns: campaigns.filter((campaign) => campaign.status_id === defaultStatus?.id),
    },
  }
}

function sumMxn(payments: PaymentWithCampaign[]): number {
  return round2(
    payments.reduce(
      (acc, payment) => round2(acc + toMxn(Number(payment.amount), Number(payment.campaign.fx_rate_mxn))),
      0,
    ),
  )
}

function lastDayOfMonth(iso: IsoDate): IsoDate {
  const [year, month] = iso.split('-').map(Number)
  const last = new Date(year, month, 0)
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}
