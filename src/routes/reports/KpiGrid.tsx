import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { calcCommission } from '@/lib/commission'
import { formatMoney } from '@/lib/money'
import { deltaPct } from '@/lib/periods'
import { cn } from '@/lib/utils'
import type { ReportSummary } from '@/types'

type Tile = { label: string; value: string; delta: number | null; tone?: 'overdue' }

export function KpiGrid({
  summary,
  previous,
}: {
  summary: ReportSummary
  previous: ReportSummary | null
}) {
  const mxn = (value: number) => formatMoney(value, 'MXN')
  const delta = (pick: (s: ReportSummary) => number) =>
    previous ? deltaPct(pick(summary), pick(previous)) : null

  const tiles: Tile[] = [
    { label: 'Ventas netas', value: mxn(summary.sales.net_mxn), delta: delta((s) => s.sales.net_mxn) },
    { label: 'Ventas brutas', value: mxn(summary.sales.gross_mxn), delta: delta((s) => s.sales.gross_mxn) },
    { label: 'Cobrado', value: mxn(summary.collections.collected_mxn), delta: delta((s) => s.collections.collected_mxn) },
    { label: 'Por cobrar', value: mxn(summary.collections.pending_mxn), delta: delta((s) => s.collections.pending_mxn) },
    { label: 'Vencido', value: mxn(summary.collections.overdue_mxn), delta: delta((s) => s.collections.overdue_mxn), tone: 'overdue' },
    { label: 'Comisiones', value: mxn(summary.commissions.generated_mxn), delta: delta((s) => s.commissions.generated_mxn) },
    { label: 'Campañas', value: String(summary.campaigns.total), delta: delta((s) => s.campaigns.total) },
    { label: 'Ticket promedio', value: mxn(summary.sales.avg_ticket_mxn), delta: delta((s) => s.sales.avg_ticket_mxn) },
  ]

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-surface px-4 py-3.5">
          <p className="text-[13px] text-ink-muted">{tile.label}</p>
          <p
            className={cn(
              'mt-1 font-heading text-[22px] leading-tight tabular-nums',
              tile.tone === 'overdue' && Number.parseFloat(tile.value.replace(/[^\d.-]/g, '')) > 0 && 'text-overdue',
            )}
          >
            {tile.value}
          </p>
          <Delta value={tile.delta} />
        </div>
      ))}
    </div>
  )
}

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return <p className="mt-1 text-[12px] text-ink-muted">Sin periodo anterior</p>
  }
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  return (
    <p
      className={cn(
        'mt-1 flex items-center gap-0.5 text-[12px] tabular-nums',
        value > 0 ? 'text-paid' : value < 0 ? 'text-overdue' : 'text-ink-muted',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {value > 0 ? '+' : ''}{value} % vs periodo anterior
    </p>
  )
}

/** Comisión del periodo, para la tabla de campañas y el CSV. */
export function campaignCommission(net: number, pct: number): number {
  return calcCommission(net, pct)
}
