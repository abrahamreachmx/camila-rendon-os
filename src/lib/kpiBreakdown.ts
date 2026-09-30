import { calcCommission } from '@/lib/commission'
import { isOverdue, todayIso, type IsoDate } from '@/lib/dates'
import { round2, toMxn, type Currency } from '@/lib/money'
import type { CampaignListRow, PaymentWithCampaign, ReportSummary } from '@/types'

/** Los ocho indicadores de Reportes. */
export type KpiKey =
  | 'net'
  | 'gross'
  | 'collected'
  | 'pending'
  | 'overdue'
  | 'commissions'
  | 'campaigns'
  | 'avg_ticket'

/** Los que se componen de cobros; el resto, de las campañas del periodo. */
export const PAYMENT_KPIS = ['collected', 'pending', 'overdue'] as const
export type PaymentKpi = (typeof PAYMENT_KPIS)[number]

export function isPaymentKpi(kpi: KpiKey): kpi is PaymentKpi {
  return (PAYMENT_KPIS as readonly string[]).includes(kpi)
}

export const KPI_LABEL: Record<KpiKey, string> = {
  net: 'Ventas netas',
  gross: 'Ventas brutas',
  collected: 'Cobrado',
  pending: 'Por cobrar',
  overdue: 'Vencido',
  commissions: 'Comisiones',
  campaigns: 'Campañas',
  avg_ticket: 'Ticket promedio',
}

export type BreakdownRow = {
  id: string
  campaignId: string
  company: string
  campaign: string
  /** Fecha de pago o de vencimiento; sólo en los indicadores de cobros. */
  date: IsoDate | null
  currency: Currency
  amount: number
  amountMxn: number
  /** Etiqueta del estatus: de la campaña o del cobro (con "vencido" calculado). */
  status: string | null
  statusColor: string | null
}

export type Breakdown = {
  rows: BreakdownRow[]
  totalMxn: number
  /** Subtotales en la moneda original, sólo las monedas que aparecen. */
  byCurrency: { currency: Currency; amount: number }[]
  /** Lo que dice el indicador en el RPC, para comprobar que cuadra. */
  expectedMxn: number
}

const CURRENCY_ORDER: Currency[] = ['MXN', 'USD', 'EUR', 'COP']

/** Lo que el RPC reporta para cada indicador, en pesos (o conteo para Campañas). */
export function kpiValue(summary: ReportSummary, kpi: KpiKey): number {
  switch (kpi) {
    case 'net': return Number(summary.sales.net_mxn)
    case 'gross': return Number(summary.sales.gross_mxn)
    case 'collected': return Number(summary.collections.collected_mxn)
    case 'pending': return Number(summary.collections.pending_mxn)
    case 'overdue': return Number(summary.collections.overdue_mxn)
    case 'commissions': return Number(summary.commissions.generated_mxn)
    case 'campaigns': return Number(summary.campaigns.total)
    case 'avg_ticket': return Number(summary.sales.avg_ticket_mxn)
  }
}

/**
 * Desglose de un indicador de campañas. Ventas netas, Campañas y Ticket
 * promedio se desglosan por neto; Ventas brutas por bruto; Comisiones por la
 * comisión de cada campaña.
 */
export function campaignBreakdown(
  campaigns: readonly CampaignListRow[],
  kpi: Exclude<KpiKey, PaymentKpi>,
  summary: ReportSummary,
): Breakdown {
  const rows = campaigns.map((c): BreakdownRow => {
    const currency = c.currency as Currency
    const net = Number(c.net_amount)
    const amount =
      kpi === 'gross'
        ? round2(Number(c.gross_amount))
        : kpi === 'commissions'
          ? calcCommission(net, Number(c.commission_pct))
          : round2(net)
    return {
      id: c.id,
      campaignId: c.id,
      company: c.company?.name ?? '—',
      campaign: c.name,
      date: null,
      currency,
      amount,
      amountMxn: toMxn(amount, Number(c.fx_rate_mxn)),
      status: c.status?.name ?? null,
      statusColor: c.status?.color ?? null,
    }
  })
  return finish(rows, kpiValue(summary, kpi))
}

/** Desglose de Cobrado, Por cobrar o Vencido a partir de los cobros ya filtrados. */
export function paymentBreakdown(
  payments: readonly PaymentWithCampaign[],
  kpi: PaymentKpi,
  summary: ReportSummary,
  statusStyle: (status: string, overdue: boolean) => { label: string; color: string },
  today: IsoDate = todayIso(),
): Breakdown {
  const rows = payments.map((p): BreakdownRow => {
    const currency = p.campaign.currency as Currency
    const amount = round2(Number(p.amount))
    const style = statusStyle(p.status, isOverdue(p.due_date, p.status, today))
    return {
      id: p.id,
      campaignId: p.campaign.id,
      company: p.campaign.company?.name ?? '—',
      campaign: p.campaign.name,
      date: kpi === 'collected' ? (p.paid_at ?? p.due_date) : p.due_date,
      currency,
      amount,
      amountMxn: toMxn(amount, Number(p.campaign.fx_rate_mxn)),
      status: style.label,
      statusColor: style.color,
    }
  })
  return finish(rows, kpiValue(summary, kpi))
}

function finish(rows: BreakdownRow[], expectedMxn: number): Breakdown {
  const sorted = [...rows].sort((a, b) => b.amountMxn - a.amountMxn)
  const totals = new Map<Currency, number>()
  let totalMxn = 0
  for (const row of sorted) {
    totals.set(row.currency, round2((totals.get(row.currency) ?? 0) + row.amount))
    totalMxn = round2(totalMxn + row.amountMxn)
  }
  return {
    rows: sorted,
    totalMxn,
    byCurrency: CURRENCY_ORDER.filter((c) => totals.has(c)).map((currency) => ({
      currency,
      amount: totals.get(currency)!,
    })),
    expectedMxn: round2(expectedMxn),
  }
}

/**
 * ¿El desglose cuadra con el indicador? Se tolera un peso: el RPC redondea la
 * suma final y aquí se redondea renglón por renglón.
 */
export function reconciles(breakdown: Breakdown, kpi: KpiKey): boolean {
  if (kpi === 'campaigns') return breakdown.rows.length === breakdown.expectedMxn
  const shown =
    kpi === 'avg_ticket'
      ? breakdown.rows.length > 0 ? breakdown.totalMxn / breakdown.rows.length : 0
      : breakdown.totalMxn
  return Math.abs(shown - breakdown.expectedMxn) <= 1
}
