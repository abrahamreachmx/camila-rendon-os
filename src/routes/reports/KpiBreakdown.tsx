import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { PAYMENT_STATUS_STYLE, StatusBadge } from '@/components/data/StatusBadge'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { listReportPayments } from '@/lib/api/reports'
import { formatDateLong, formatDateShort, todayIso } from '@/lib/dates'
import {
  KPI_LABEL,
  campaignBreakdown,
  isPaymentKpi,
  kpiValue,
  paymentBreakdown,
  reconciles,
  type Breakdown,
  type KpiKey,
} from '@/lib/kpiBreakdown'
import { formatMoney, type Currency } from '@/lib/money'
import type { CampaignListRow, PaymentStatus, ReportSummary } from '@/types'

/** Estilo del estatus de un cobro, con "vencido" calculado. */
function paymentStyle(status: string, overdue: boolean) {
  return PAYMENT_STATUS_STYLE[overdue ? 'vencido' : (status as PaymentStatus)]
}

/**
 * Panel lateral con lo que compone un indicador de Reportes: las campañas o los
 * cobros que suma, con su monto original y en pesos. El pie cuadra con la cifra
 * del indicador; si no cuadrara, se dice en vez de esconderlo.
 */
export function KpiBreakdown({
  kpi,
  onClose,
  summary,
  campaigns,
  periodLabel,
}: {
  kpi: KpiKey | null
  onClose: () => void
  summary: ReportSummary
  /** Las campañas del periodo, el mismo filtro que la tabla de abajo. */
  campaigns: CampaignListRow[]
  periodLabel: string
}) {
  const navigate = useNavigate()
  const { from, to } = summary.period
  const today = todayIso()
  const paymentKpi = kpi && isPaymentKpi(kpi) ? kpi : null

  const { data: payments, isPending } = useQuery({
    queryKey: ['report-payments', paymentKpi, from, to],
    queryFn: () => listReportPayments(paymentKpi!, from, to, today),
    enabled: paymentKpi !== null,
  })

  let breakdown: Breakdown | null = null
  if (kpi && !isPaymentKpi(kpi)) breakdown = campaignBreakdown(campaigns, kpi, summary)
  if (paymentKpi && payments) breakdown = paymentBreakdown(payments, paymentKpi, summary, paymentStyle, today)

  const value = kpi ? kpiValue(summary, kpi) : 0
  const headline = kpi === 'campaigns' ? String(value) : formatMoney(value, 'MXN')

  return (
    <Sheet open={kpi !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {kpi && (
          <>
            <SheetHeader>
              <SheetTitle>{KPI_LABEL[kpi]} · {periodLabel}</SheetTitle>
              <p className="mt-1 font-heading text-[30px] leading-tight tabular-nums">{headline}</p>
              <SheetDescription className="mt-1">{criteria(kpi, from, to, today)}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              {paymentKpi && isPending ? (
                <LoadingRows rows={4} />
              ) : !breakdown || breakdown.rows.length === 0 ? (
                <EmptyState message="Nada en este periodo." />
              ) : (
                <BreakdownTable
                  kpi={kpi}
                  breakdown={breakdown}
                  onOpen={(campaignId) => {
                    onClose()
                    void navigate(`/campanas/${campaignId}`)
                  }}
                />
              )}
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function BreakdownTable({
  kpi,
  breakdown,
  onOpen,
}: {
  kpi: KpiKey
  breakdown: Breakdown
  onOpen: (campaignId: string) => void
}) {
  const withDate = isPaymentKpi(kpi)
  const withStatus = withDate || kpi === 'campaigns'
  const multiCurrency = breakdown.byCurrency.length > 1 || breakdown.byCurrency[0]?.currency !== 'MXN'
  const n = breakdown.rows.length
  const ok = reconciles(breakdown, kpi)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="bg-surface-2 text-left text-[12px] font-semibold text-ink-muted">
              <th scope="col" className="px-3 py-2">Marca · campaña</th>
              {withDate && <th scope="col" className="px-3 py-2 text-right">{kpi === 'collected' ? 'Pagado' : 'Vence'}</th>}
              <th scope="col" className="px-3 py-2 text-right">{amountHeader(kpi)}</th>
              {multiCurrency && <th scope="col" className="px-3 py-2 text-right">MXN</th>}
            </tr>
          </thead>
          <tbody>
            {breakdown.rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                onClick={() => onOpen(row.campaignId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onOpen(row.campaignId)
                }}
                className="cursor-pointer border-t border-line hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
              >
                <td className="px-3 py-2.5">
                  <p className="font-medium">{row.company}</p>
                  <p className="flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
                    <span>{row.campaign}</span>
                    {withStatus && row.status && <StatusBadge label={row.status} color={row.statusColor ?? '#8B8079'} />}
                  </p>
                </td>
                {withDate && (
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">{formatDateShort(row.date)}</td>
                )}
                <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
                  {formatMoney(row.amount, row.currency as Currency)}
                </td>
                {multiCurrency && (
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-ink-muted">
                    {formatMoney(row.amountMxn, 'MXN')}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {multiCurrency &&
              breakdown.byCurrency.map((c) => (
                <tr key={c.currency} className="border-t border-line bg-surface-2 text-[13px] text-ink-muted">
                  <td className="px-3 py-1.5" colSpan={withDate ? 2 : 1}>En {c.currency}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(c.amount, c.currency)}</td>
                  <td />
                </tr>
              ))}
            <tr className="border-t border-line bg-surface-2 font-semibold">
              <td className="px-3 py-2.5" colSpan={withDate ? 2 : 1}>
                Total · {n} {withDate ? (n === 1 ? 'cobro' : 'cobros') : n === 1 ? 'campaña' : 'campañas'}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums" colSpan={multiCurrency ? 2 : 1}>
                {formatMoney(breakdown.totalMxn, 'MXN')}
              </td>
            </tr>
            {kpi === 'avg_ticket' && n > 0 && (
              <tr className="bg-surface-2 text-[13px] text-ink-muted">
                <td className="px-3 pb-2.5" colSpan={withDate ? 2 : 1}>Promedio: total ÷ {n}</td>
                <td className="px-3 pb-2.5 text-right tabular-nums" colSpan={multiCurrency ? 2 : 1}>
                  {formatMoney(breakdown.totalMxn / n, 'MXN')}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
      {!ok && (
        <p className="text-[13px] text-ink-muted">
          La suma no coincide exacto con el indicador. Puede pasar si un cobro cambió hace un momento o, en
          Vencido, por la fecha de corte de hoy. Recarga la página para recalcular.
        </p>
      )}
    </div>
  )
}

function amountHeader(kpi: KpiKey): string {
  if (kpi === 'gross') return 'Bruto'
  if (kpi === 'commissions') return 'Comisión'
  if (isPaymentKpi(kpi)) return 'Monto'
  return 'Neto'
}

/** El criterio del indicador en palabras, para que se entienda qué entra y qué no. */
function criteria(kpi: KpiKey, from: string, to: string, today: string): string {
  const periodo = `entre el ${formatDateLong(from)} y el ${formatDateLong(to)}`
  switch (kpi) {
    case 'collected':
      return `Cobros marcados como pagados ${periodo}, según su fecha de pago.`
    case 'pending':
      return `Cobros sin pagar que vencen ${periodo}.`
    case 'overdue':
      return `Cobros sin pagar que vencieron antes del ${formatDateLong(to < today ? to : today)}, de cualquier mes.`
    case 'commissions':
      return 'Comisión de cada campaña cerrada en el periodo: su % sobre el neto.'
    case 'gross':
      return 'Bruto de las campañas cerradas en el periodo (en pesos, con IVA y retención).'
    case 'avg_ticket':
      return 'Neto de las campañas cerradas en el periodo, dividido entre cuántas son.'
    default:
      return 'Campañas cuyo mes de cierre cae en el periodo.'
  }
}
