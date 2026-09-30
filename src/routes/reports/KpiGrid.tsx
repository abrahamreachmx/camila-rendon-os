import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react'
import { calcCommission } from '@/lib/commission'
import type { KpiKey } from '@/lib/kpiBreakdown'
import { formatMoney } from '@/lib/money'
import { deltaPct } from '@/lib/periods'
import { cn } from '@/lib/utils'
import type { ReportSummary } from '@/types'

type Tile = { key: KpiKey; label: string; value: string; delta: number | null; tone?: 'overdue' }

export function KpiGrid({
  summary,
  previous,
  onSelect,
}: {
  summary: ReportSummary
  previous: ReportSummary | null
  /** Abre el desglose. Sin esto (reporte guardado) las tarjetas no son clicables. */
  onSelect?: (kpi: KpiKey) => void
}) {
  const mxn = (value: number) => formatMoney(value, 'MXN')
  const delta = (pick: (s: ReportSummary) => number) =>
    previous ? deltaPct(pick(summary), pick(previous)) : null

  const tiles: Tile[] = [
    { key: 'net', label: 'Ventas netas', value: mxn(summary.sales.net_mxn), delta: delta((s) => s.sales.net_mxn) },
    { key: 'gross', label: 'Ventas brutas', value: mxn(summary.sales.gross_mxn), delta: delta((s) => s.sales.gross_mxn) },
    { key: 'collected', label: 'Cobrado', value: mxn(summary.collections.collected_mxn), delta: delta((s) => s.collections.collected_mxn) },
    { key: 'pending', label: 'Por cobrar', value: mxn(summary.collections.pending_mxn), delta: delta((s) => s.collections.pending_mxn) },
    { key: 'overdue', label: 'Vencido', value: mxn(summary.collections.overdue_mxn), delta: delta((s) => s.collections.overdue_mxn), tone: 'overdue' },
    { key: 'commissions', label: 'Comisiones', value: mxn(summary.commissions.generated_mxn), delta: delta((s) => s.commissions.generated_mxn) },
    { key: 'campaigns', label: 'Campañas', value: String(summary.campaigns.total), delta: delta((s) => s.campaigns.total) },
    { key: 'avg_ticket', label: 'Ticket promedio', value: mxn(summary.sales.avg_ticket_mxn), delta: delta((s) => s.sales.avg_ticket_mxn) },
  ]

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
      {tiles.map((tile) => {
        const body = (
          <>
          <p className="flex items-center justify-between gap-1 text-[13px] text-ink-muted">
            {tile.label}
            {onSelect && (
              <ChevronRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
            )}
          </p>
          <p
            className={cn(
              'mt-1 font-heading text-[22px] leading-tight tabular-nums',
              tile.tone === 'overdue' && Number.parseFloat(tile.value.replace(/[^\d.-]/g, '')) > 0 && 'text-overdue',
            )}
          >
            {tile.value}
          </p>
          <Delta value={tile.delta} />
          </>
        )
        return onSelect ? (
          <button
            key={tile.key}
            type="button"
            aria-haspopup="dialog"
            aria-label={`${tile.label}: ${tile.value}. Ver desglose.`}
            onClick={() => onSelect(tile.key)}
            className="group bg-surface px-4 py-3.5 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none focus-visible:ring-inset"
          >
            {body}
          </button>
        ) : (
          <div key={tile.key} className="bg-surface px-4 py-3.5">{body}</div>
        )
      })}
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
