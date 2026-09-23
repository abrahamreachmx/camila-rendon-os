import { useNavigate } from 'react-router'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { PAYMENT_STATUS_STYLE, StatusBadge } from '@/components/data/StatusBadge'
import { summarizeMonthIncome } from '@/lib/collection'
import { formatDateShort, isOverdue, todayIso } from '@/lib/dates'
import { formatMoney, type Currency } from '@/lib/money'
import type { PaymentStatus, PaymentWithCampaign } from '@/types'

/**
 * Lo que debe entrar en el mes, marca por marca. Una fila por cobro: si una
 * campaña tiene dos pagos en el mes, salen los dos con su fecha.
 */
export function MonthlyIncomeSummary({
  payments,
  monthLabel,
}: {
  payments: PaymentWithCampaign[]
  monthLabel: string
}) {
  const navigate = useNavigate()
  const today = todayIso()
  const summary = summarizeMonthIncome(payments, today)

  const columns: Column<PaymentWithCampaign>[] = [
    {
      key: 'company',
      header: 'Marca',
      sortValue: (row) => row.campaign.company?.name ?? '',
      cell: (row) => <span className="font-medium">{row.campaign.company?.name ?? '—'}</span>,
    },
    {
      key: 'campaign',
      header: 'Campaña',
      sortValue: (row) => row.campaign.name,
      cell: (row) => row.campaign.name,
    },
    {
      key: 'due',
      header: 'Fecha',
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.due_date,
      cell: (row) => formatDateShort(row.due_date),
    },
    {
      key: 'amount',
      header: 'Monto',
      align: 'right',
      sortValue: (row) => Number(row.amount) * Number(row.campaign.fx_rate_mxn),
      cell: (row) => <Amount value={Number(row.amount)} currency={row.campaign.currency as Currency} strong />,
    },
    {
      key: 'status',
      header: 'Estatus',
      hideOnMobile: true,
      cell: (row) => {
        const overdue = isOverdue(row.due_date, row.status, today)
        const style = PAYMENT_STATUS_STYLE[overdue ? 'vencido' : (row.status as PaymentStatus)]
        return <StatusBadge label={style.label} color={style.color} />
      },
    },
  ]

  if (payments.length === 0) {
    return <EmptyState message={`Sin cobros programados en ${monthLabel.toLowerCase()}.`} />
  }

  return (
    <div className="space-y-3">
      <DataTable
        rows={payments}
        columns={columns}
        getRowId={(row) => row.id}
        initialSort={{ key: 'due', direction: 'asc' }}
        onRowClick={(row) => void navigate(`/campanas/${row.campaign.id}`)}
      />

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-2 text-[12px] font-semibold text-ink-muted">
            <tr>
              <th className="px-4 py-2 text-left">Total del mes</th>
              <th className="px-4 py-2 text-right">Esperado</th>
              <th className="px-4 py-2 text-right">Cobrado</th>
              <th className="px-4 py-2 text-right">Por cobrar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {summary.byCurrency.map((row) => (
              <tr key={row.currency}>
                <td className="px-4 py-2 text-ink-muted">En {row.currency}</td>
                <td className="px-4 py-2 text-right"><Amount value={row.expected} currency={row.currency} /></td>
                <td className="px-4 py-2 text-right"><Amount value={row.paid} currency={row.currency} /></td>
                <td className="px-4 py-2 text-right"><Amount value={row.pending} currency={row.currency} /></td>
              </tr>
            ))}
            {/* Con una sola moneda en pesos, la fila consolidada repetiría la de arriba. */}
            {!(summary.byCurrency.length === 1 && summary.byCurrency[0].currency === 'MXN') && (
              <tr className="bg-surface-2/60">
                <td className="px-4 py-2 font-semibold">Consolidado en pesos</td>
                <td className="px-4 py-2 text-right"><Amount value={summary.mxn.expected} currency="MXN" strong /></td>
                <td className="px-4 py-2 text-right"><Amount value={summary.mxn.paid} currency="MXN" strong /></td>
                <td className="px-4 py-2 text-right"><Amount value={summary.mxn.pending} currency="MXN" strong /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * La moneda siempre explícita. En es-MX el dólar y el euro ya salen como
 * "USD 1,700.00"; sólo el peso sale con un "$" a secas y necesita su etiqueta.
 */
function Amount({ value, currency, strong }: { value: number; currency: Currency; strong?: boolean }) {
  return (
    <span className={strong ? 'font-semibold tabular-nums' : 'tabular-nums'}>
      {formatMoney(value, currency)}
      {currency === 'MXN' && <span className="ml-1 text-[11px] font-semibold text-ink-muted">MXN</span>}
    </span>
  )
}
