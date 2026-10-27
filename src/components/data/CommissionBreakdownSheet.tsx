import { useNavigate } from 'react-router'
import { EmptyState } from '@/components/data/EmptyState'
import { PAYMENT_STATUS_STYLE, StatusBadge } from '@/components/data/StatusBadge'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { commissionByCampaign } from '@/lib/collection'
import { formatMoney } from '@/lib/money'
import type { PaymentWithCampaign } from '@/types'

export type CommissionFocus = 'pendiente' | 'todas'

/**
 * Panel lateral con las campañas que componen la comisión del mes. Con
 * focus 'pendiente' (la tarjeta del Inicio) sólo salen las que aún no se le
 * pagan a Ana; con 'todas' (el Resumen del mes), también las pagadas.
 */
export function CommissionBreakdownSheet({
  open,
  onClose,
  payments,
  monthLabel,
  focus,
}: {
  open: boolean
  onClose: () => void
  /** Los cobros del mes, de listMonthPayments. */
  payments: readonly PaymentWithCampaign[]
  monthLabel: string
  focus: CommissionFocus
}) {
  const navigate = useNavigate()
  const breakdown = commissionByCampaign(payments)
  const rows = focus === 'pendiente' ? breakdown.rows.filter((row) => !row.paid) : breakdown.rows
  const headline = focus === 'pendiente' ? breakdown.pendingMxn : breakdown.totalMxn
  const multiCurrency = rows.some((row) => row.currency !== 'MXN')
  const n = rows.length

  function openCampaign(campaignId: string) {
    onClose()
    void navigate(`/campanas/${campaignId}`)
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {focus === 'pendiente' ? 'Comisiones pendientes' : 'Comisión del mes'} · {monthLabel}
          </SheetTitle>
          <p className="mt-1 font-heading text-[30px] leading-tight tabular-nums">{formatMoney(headline, 'MXN')}</p>
          <SheetDescription className="mt-1">
            El % de cada campaña sobre su neto, repartido entre sus cobros: cuenta la parte de los que se
            pagaron en el mes y de los que faltan por cobrar hasta su fin.
            {focus === 'pendiente' && ' Sólo campañas cuya comisión no está marcada como pagada.'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {n === 0 ? (
            <EmptyState
              message={
                focus === 'pendiente'
                  ? `Sin comisiones pendientes en ${monthLabel.toLowerCase()}.`
                  : `Sin comisiones en ${monthLabel.toLowerCase()}.`
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-surface-2 text-left text-[12px] font-semibold text-ink-muted">
                    <th scope="col" className="px-3 py-2">Marca · campaña</th>
                    <th scope="col" className="px-3 py-2 text-right">Cobros</th>
                    <th scope="col" className="px-3 py-2 text-right">Comisión</th>
                    {multiCurrency && <th scope="col" className="px-3 py-2 text-right">MXN</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const style = row.paid ? PAYMENT_STATUS_STYLE.pagado : PAYMENT_STATUS_STYLE.pendiente
                    return (
                      <tr
                        key={row.campaignId}
                        tabIndex={0}
                        onClick={() => openCampaign(row.campaignId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') openCampaign(row.campaignId)
                        }}
                        className="cursor-pointer border-t border-line hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{row.company}</p>
                          <p className="flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
                            <span>{row.campaign} · {row.pct} %</span>
                            <StatusBadge label={row.paid ? 'Pagada' : 'Pendiente'} color={style.color} />
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{row.payments}</td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
                          {formatMoney(row.amount, row.currency)}
                        </td>
                        {multiCurrency && (
                          <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-ink-muted">
                            {formatMoney(row.amountMxn, 'MXN')}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line bg-surface-2 font-semibold">
                    <td className="px-3 py-2.5" colSpan={2}>
                      Total · {n} {n === 1 ? 'campaña' : 'campañas'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums" colSpan={multiCurrency ? 2 : 1}>
                      {formatMoney(headline, 'MXN')}
                    </td>
                  </tr>
                  {focus === 'todas' && (
                    <tr className="bg-surface-2 text-[13px] text-ink-muted">
                      <td className="px-3 pb-2.5" colSpan={2}>Por pagar</td>
                      <td className="px-3 pb-2.5 text-right tabular-nums" colSpan={multiCurrency ? 2 : 1}>
                        {formatMoney(breakdown.pendingMxn, 'MXN')}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
