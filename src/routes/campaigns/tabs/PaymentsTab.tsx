import { useMutation } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/data/EmptyState'
import { MoneyCell } from '@/components/data/MoneyCell'
import { PAYMENT_STATUS_STYLE, StatusBadge } from '@/components/data/StatusBadge'
import { PaymentPlanGenerator } from '@/components/forms/PaymentPlanGenerator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { deletePayment, replacePlan, updatePayment } from '@/lib/api/payments'
import { formatDateLong, isOverdue } from '@/lib/dates'
import { round2, sumBy, type Currency } from '@/lib/money'
import { remainingToCollect, type PlanRow } from '@/lib/paymentPlan'
import type { CampaignWithRelations, PaymentStatus } from '@/types'

export function CampaignPaymentsTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignWithRelations
  onSaved: () => void
}) {
  const currency = campaign.currency as Currency
  const paid = campaign.payments.filter((payment) => payment.status === 'pagado')
  const [plan, setPlan] = useState<PlanRow[]>([])
  const [confirmReplace, setConfirmReplace] = useState(false)

  useEffect(() => { setPlan([]) }, [campaign.id])

  const net = Number(campaign.net_amount)
  const pending = remainingToCollect(net, campaign.payments.map((p) => ({
    amount: Number(p.amount), status: p.status,
  })))

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) => updatePayment(id, { status }),
    onSuccess: () => { onSaved(); toast.success('Cobro actualizado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => { onSaved(); toast.success('Cobro eliminado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const apply = useMutation({
    mutationFn: () => replacePlan(campaign.id, plan),
    onSuccess: () => { setPlan([]); setConfirmReplace(false); onSaved(); toast.success('Plan de pagos guardado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const planned = sumBy(campaign.payments, (payment) => Number(payment.amount))

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-[16px] font-semibold">Cobros de esta campaña</h3>
        {campaign.payments.length === 0 ? (
          <EmptyState message="Todavía no hay cobros. Genera el plan abajo." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[560px] border-collapse text-[14px]">
              <thead>
                <tr className="bg-surface-2 text-[13px]">
                  <th scope="col" className="px-3 py-2.5 text-left font-semibold">Vence</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Monto</th>
                  <th scope="col" className="px-3 py-2.5 text-left font-semibold">Estatus</th>
                  <th scope="col" className="px-3 py-2.5 text-left font-semibold">Pagado el</th>
                  <th scope="col" className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {campaign.payments.map((payment) => {
                  const overdue = isOverdue(payment.due_date, payment.status)
                  const style = PAYMENT_STATUS_STYLE[overdue ? 'vencido' : (payment.status as PaymentStatus)]
                  return (
                    <tr key={payment.id} className="border-t border-line">
                      <td className="px-3 py-2.5">{formatDateLong(payment.due_date)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <MoneyCell amount={payment.amount} currency={currency} strong />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge label={style.label} color={style.color} />
                          <Select value={payment.status}
                            onValueChange={(status) =>
                              changeStatus.mutate({ id: payment.id, status: status as PaymentStatus })}>
                            <SelectTrigger className="h-8 w-[140px]" aria-label={`Cambiar estatus del cobro del ${payment.due_date}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="en_proceso">En proceso</SelectItem>
                              <SelectItem value="pagado">Pagado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-ink-muted">{formatDateLong(payment.paid_at)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Button variant="ghost" size="icon" aria-label="Eliminar cobro"
                          onClick={() => remove.mutate(payment.id)}>
                          <Trash2 className="size-4 text-overdue" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-surface-2">
                  <td className="px-3 py-2.5 text-right font-semibold">Total planeado</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                    <MoneyCell amount={planned} currency={currency} strong />
                  </td>
                  <td colSpan={3} className="px-3 py-2.5 text-[13px] text-ink-muted">
                    {round2(planned - net) === 0
                      ? 'Cuadra con el neto de la campaña.'
                      : `El neto es ${net}; hay una diferencia de ${round2(net - planned)}.`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-[16px] font-semibold">Generar plan</h3>
        <p className="mb-4 text-[13px] text-ink-muted">
          {paid.length > 0
            ? `Hay ${paid.length} cobro(s) ya pagado(s): no se tocan. Falta por cobrar ${pending}.`
            : 'Elige un plazo y ajusta las filas si hace falta.'}
        </p>
        <PaymentPlanGenerator
          rows={plan}
          onChange={setPlan}
          total={pending}
          currency={currency}
          baseDate={campaign.signed_at}
        />
        {plan.length > 0 && (
          <Button className="mt-4"
            onClick={() => (campaign.payments.length > 0 ? setConfirmReplace(true) : apply.mutate())}
            disabled={apply.isPending}>
            {apply.isPending ? 'Guardando…' : 'Guardar plan'}
          </Button>
        )}
      </section>

      <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reemplazar el plan de pagos</AlertDialogTitle>
            <AlertDialogDescription>
              {paid.length > 0
                ? `Se conservan los ${paid.length} cobro(s) ya pagado(s) y se reemplazan los demás.`
                : 'Se reemplazan todos los cobros pendientes de esta campaña.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => apply.mutate()}>Reemplazar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
