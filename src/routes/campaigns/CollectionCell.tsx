import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import {
  COLLECTION_STATUS_STYLE,
  PAYMENT_STATUS_STYLE,
  StatusBadge,
} from '@/components/data/StatusBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setCampaignPaymentsStatus, updatePayment } from '@/lib/api/payments'
import type { CampaignCollection } from '@/lib/collection'
import { formatDateShort, isOverdue, todayIso } from '@/lib/dates'
import { formatMoney, type Currency } from '@/lib/money'
import type { CampaignListRow, PaymentStatus } from '@/types'

/** Los únicos estatus que se guardan. Parcial y vencido salen solos. */
const OPTIONS: PaymentStatus[] = ['pendiente', 'en_proceso', 'pagado']

const TOAST: Record<PaymentStatus, string> = {
  pendiente: 'Cobro marcado como pendiente.',
  en_proceso: 'Cobro marcado en proceso.',
  pagado: 'Cobro marcado como pagado.',
}

/**
 * Insignia de cobro de la tabla de campañas, que además abre un menú para
 * cambiarlo. Arriba se cambia todo el plan de la campaña; si tiene varios
 * cobros, cada uno tiene su submenú para marcarlos por separado.
 */
export function CollectionCell({
  campaign,
  collection,
}: {
  campaign: CampaignListRow
  collection: CampaignCollection
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const today = todayIso()
  const payments = [...(campaign.payments ?? [])].sort((a, b) => a.due_date.localeCompare(b.due_date))
  const currency = campaign.currency as Currency

  const change = useMutation({
    mutationFn: ({ paymentId, status }: { paymentId?: string; status: PaymentStatus }) =>
      paymentId
        ? updatePayment(paymentId, { status }).then(() => undefined)
        : setCampaignPaymentsStatus(campaign.id, status),
    onSuccess: (_, { status }) => {
      for (const key of ['campaigns', 'campaign', 'home', 'payments', 'report', 'report-payments']) {
        void queryClient.invalidateQueries({ queryKey: [key] })
      }
      toast.success(TOAST[status])
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const style = COLLECTION_STATUS_STYLE[collection.status]
  // Lo vencido se distingue por color y por palabra: sólo por color sería
  // información inaccesible para quien no distingue el rojo.
  const label =
    collection.status === 'parcial'
      ? `Parcial · ${collection.paidPct} %${collection.hasOverdue ? ' · vencido' : ''}`
      : style.label
  const color = collection.hasOverdue ? PAYMENT_STATUS_STYLE.vencido.color : style.color

  // La palomita va en la opción que describe todo el plan, si es que hay una.
  const allSame = payments.length > 0 && payments.every((p) => p.status === payments[0].status)
  const current = allSame ? (payments[0].status as PaymentStatus) : null

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Cobro de ${campaign.name}: ${label}. Clic para cambiarlo.`}
          disabled={change.isPending}
          className="rounded-full focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none"
        >
          <StatusBadge label={label} color={color} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-auto min-w-[240px]">
          {payments.length === 0 ? (
            <>
              <DropdownMenuLabel className="font-normal text-ink-muted">Sin cobros todavía</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => void navigate(`/campanas/${campaign.id}`)}>
                Crear el plan en la campaña
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-[12px] font-semibold text-ink-muted">
                {payments.length === 1 ? 'Cobro' : `Los ${payments.length} cobros`}
              </DropdownMenuLabel>
              {OPTIONS.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => change.mutate({ status })}
                  className="justify-between gap-3"
                >
                  <StatusBadge label={PAYMENT_STATUS_STYLE[status].label} color={PAYMENT_STATUS_STYLE[status].color} />
                  {status === current && <Check className="size-4 text-plum" />}
                </DropdownMenuItem>
              ))}

              {payments.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[12px] font-semibold text-ink-muted">Uno por uno</DropdownMenuLabel>
                  {payments.map((payment) => {
                    const overdue = isOverdue(payment.due_date, payment.status, today)
                    const own = PAYMENT_STATUS_STYLE[overdue ? 'vencido' : (payment.status as PaymentStatus)]
                    return (
                      <DropdownMenuSub key={payment.id}>
                        <DropdownMenuSubTrigger className="gap-2">
                          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: own.color }} aria-hidden />
                          <span className="tabular-nums">{formatDateShort(payment.due_date)}</span>
                          <span className="tabular-nums">{formatMoney(Number(payment.amount), currency)}</span>
                          <span className="text-[12px] text-ink-muted">{own.label}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {OPTIONS.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onSelect={() => change.mutate({ paymentId: payment.id, status })}
                              className="justify-between gap-3"
                            >
                              <StatusBadge
                                label={PAYMENT_STATUS_STYLE[status].label}
                                color={PAYMENT_STATUS_STYLE[status].color}
                              />
                              {status === payment.status && <Check className="size-4 text-plum" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )
                  })}
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
