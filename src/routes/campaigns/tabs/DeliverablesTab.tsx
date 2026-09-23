import { useMutation } from '@tanstack/react-query'
import { Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/data/EmptyState'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { generateDeliverables, updateDeliverable } from '@/lib/api/deliverables'
import { isOverdue, todayIso } from '@/lib/dates'
import { deliverableLabel } from '@/lib/deliverables'
import { formatMonth } from '@/lib/periods'
import { cn } from '@/lib/utils'
import type { CampaignWithRelations, Deliverable, Update } from '@/types'

/**
 * Los contenidos de la campaña, pieza por pieza. Se generan solos al capturar
 * el mes de cierre; el botón está para el histórico, que se cargó sin ellos.
 */
export function CampaignDeliverablesTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignWithRelations
  onSaved: () => void
}) {
  const today = todayIso()

  const save = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Update<'campaign_deliverables'> }) =>
      updateDeliverable(id, patch),
    onSuccess: onSaved,
    onError: (error: Error) => toast.error(error.message),
  })

  const generate = useMutation({
    mutationFn: () => generateDeliverables(campaign.id),
    onSuccess: (rows: Deliverable[]) => {
      onSaved()
      toast.success(
        rows.length > 0
          ? `Se generaron ${rows.length} entregables.`
          : 'Esta campaña no tiene servicios de los que generar entregables.',
      )
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const pendientes = campaign.deliverables.filter((item) => !item.delivered).length

  if (campaign.deliverables.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          message={
            campaign.items.length === 0
              ? 'Esta campaña no tiene servicios. Captúralos en Cotización y luego genera los entregables.'
              : 'Aún no hay entregables. Se generan solos al capturar el mes de cierre, o puedes crearlos ahora.'
          }
        />
        <Button
          variant="outline"
          disabled={campaign.items.length === 0 || generate.isPending}
          onClick={() => generate.mutate()}
        >
          <Wand2 className="size-4" />
          {generate.isPending ? 'Generando…' : 'Generar entregables'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        {pendientes === 0
          ? 'Todo entregado.'
          : `${pendientes} de ${campaign.deliverables.length} por entregar.`}
        {campaign.close_month && ` Campaña cerrada en ${formatMonth(campaign.close_month)}.`}
      </p>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[620px] border-collapse text-[14px]">
          <thead>
            <tr className="bg-surface-2 text-[13px]">
              <th scope="col" className="w-12 px-3 py-2.5 text-left font-semibold">Ok</th>
              <th scope="col" className="px-3 py-2.5 text-left font-semibold">Contenido</th>
              <th scope="col" className="px-3 py-2.5 text-left font-semibold">Se comprometió</th>
              <th scope="col" className="px-3 py-2.5 text-left font-semibold">Se entregó</th>
            </tr>
          </thead>
          <tbody>
            {campaign.deliverables.map((item) => {
              const vencida = !item.delivered && isOverdue(item.due_date ?? '', 'pendiente', today)
              return (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-3 py-2.5">
                    <Checkbox
                      checked={item.delivered}
                      aria-label={`Marcar ${deliverableLabel(item)} como entregado`}
                      onCheckedChange={(value) =>
                        save.mutate({
                          id: item.id,
                          patch:
                            value === true
                              ? { delivered: true, delivered_at: item.delivered_at ?? today }
                              : { delivered: false },
                        })
                      }
                    />
                  </td>
                  <td className={cn('px-3 py-2.5', item.delivered && 'text-ink-muted line-through')}>
                    {deliverableLabel(item)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Input
                      type="date"
                      className={cn('h-8 w-[170px]', vencida && 'border-overdue text-overdue')}
                      aria-label={`Fecha comprometida de ${deliverableLabel(item)}`}
                      value={item.due_date ?? ''}
                      onChange={(event) =>
                        save.mutate({ id: item.id, patch: { due_date: event.target.value || null } })
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Input
                      type="date"
                      className="h-8 w-[170px]"
                      aria-label={`Fecha de entrega de ${deliverableLabel(item)}`}
                      value={item.delivered_at ?? ''}
                      onChange={(event) =>
                        save.mutate({
                          id: item.id,
                          patch: {
                            delivered_at: event.target.value || null,
                            delivered: Boolean(event.target.value),
                          },
                        })
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
