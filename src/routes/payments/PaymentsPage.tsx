import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { MoneyCell } from '@/components/data/MoneyCell'
import { PAYMENT_STATUS_STYLE, StatusBadge } from '@/components/data/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listOverduePayments, listPayments, updatePayment } from '@/lib/api/payments'
import { formatDateLong, isOverdue, todayIso } from '@/lib/dates'
import { formatMoney, round2, toMxn, type Currency } from '@/lib/money'
import { monthRange } from '@/lib/periods'
import { PaymentsCalendar } from '@/routes/payments/PaymentsCalendar'
import type { EffectivePaymentStatus, PaymentStatus, PaymentWithCampaign } from '@/types'

const ALL = 'todos'

export default function PaymentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const today = todayIso()

  const now = new Date()
  const year = Number(params.get('anio') ?? now.getFullYear())
  const month = Number(params.get('mes') ?? now.getMonth() + 1)
  const statusFilter = (params.get('estatus') as EffectivePaymentStatus | null) ?? null

  const range = monthRange(year, month)

  const { data: payments = [], isPending } = useQuery({
    queryKey: ['payments', { from: range.from, to: range.to }],
    queryFn: () => listPayments({ from: range.from, to: range.to }),
  })

  // Lo vencido no se busca mes por mes: si algo se atrasó en agosto tiene que
  // salir aunque estés viendo septiembre. Por eso este filtro ignora el mes.
  const showingOverdue = statusFilter === 'vencido'
  const { data: overdue = [] } = useQuery({
    queryKey: ['payments', 'overdue'],
    queryFn: () => listOverduePayments(),
    enabled: showingOverdue,
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) => updatePayment(id, { status }),
    onSuccess: () => {
      // El Inicio y la campaña dependen de esto: se refrescan sin recargar.
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
      void queryClient.invalidateQueries({ queryKey: ['home'] })
      void queryClient.invalidateQueries({ queryKey: ['campaign'] })
      toast.success('Cobro actualizado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const filtered = useMemo(() => {
    if (!statusFilter) return payments
    if (statusFilter === 'vencido') return overdue
    return payments.filter(
      (payment) => payment.status === statusFilter && !isOverdue(payment.due_date, payment.status, today),
    )
  }, [payments, overdue, statusFilter, today])

  const totalMxn = round2(
    filtered.reduce(
      (acc, payment) => round2(acc + toMxn(Number(payment.amount), Number(payment.campaign.fx_rate_mxn))),
      0,
    ),
  )

  function move(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    const params2 = new URLSearchParams(params)
    params2.set('anio', String(next.getFullYear()))
    params2.set('mes', String(next.getMonth() + 1))
    setParams(params2, { replace: true })
  }

  const columns: Column<PaymentWithCampaign>[] = [
    {
      key: 'due',
      header: 'Vence',
      sortValue: (row) => row.due_date,
      cell: (row) => formatDateLong(row.due_date),
    },
    {
      key: 'campaign',
      header: 'Campaña',
      sortValue: (row) => row.campaign.company?.name ?? '',
      cell: (row) => (
        <div className="min-w-0">
          <span className="font-heading text-[17px]">{row.campaign.company?.name ?? '—'}</span>
          <span className="block text-[13px] text-ink-muted">{row.campaign.name}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      align: 'right',
      sortValue: (row) => Number(row.amount) * Number(row.campaign.fx_rate_mxn),
      cell: (row) => <MoneyCell amount={row.amount} currency={row.campaign.currency as Currency} strong />,
    },
    {
      key: 'status',
      header: 'Estatus',
      sortValue: (row) => row.status,
      cell: (row) => {
        const overdue = isOverdue(row.due_date, row.status, today)
        const style = PAYMENT_STATUS_STYLE[overdue ? 'vencido' : (row.status as PaymentStatus)]
        return (
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <StatusBadge label={style.label} color={style.color} />
            <Select value={row.status}
              onValueChange={(status) => changeStatus.mutate({ id: row.id, status: status as PaymentStatus })}>
              <SelectTrigger className="h-8 w-[136px]" aria-label={`Cambiar estatus del cobro del ${row.due_date}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En proceso</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      },
    },
    {
      key: 'paid_at',
      header: 'Pagado el',
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.paid_at,
      cell: (row) => formatDateLong(row.paid_at),
    },
  ]

  return (
    <>
      <PageHeader
        title="Cobros"
        description="Qué entra y cuándo. Los vencidos se calculan, no se guardan."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => move(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[160px] text-center font-heading text-[19px]">{range.label}</span>
            <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => move(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      {isPending ? (
        <LoadingRows rows={6} />
      ) : (
        <div className="space-y-6">
          <PaymentsCalendar year={year} month={month} payments={payments} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select
              value={statusFilter ?? ALL}
              onValueChange={(value) => {
                const next = new URLSearchParams(params)
                if (value === ALL) next.delete('estatus')
                else next.set('estatus', value)
                setParams(next, { replace: true })
              }}
            >
              <SelectTrigger className="w-[200px]" aria-label="Filtrar por estatus"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los estatus</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En proceso</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[13px] text-ink-muted">
              {filtered.length} cobro{filtered.length === 1 ? '' : 's'}
              {showingOverdue ? ' vencido(s), de cualquier mes' : ` en ${range.label.toLowerCase()}`} ·{' '}
              <span className="tabular-nums">{formatMoney(totalMxn, 'MXN')}</span> consolidado
            </p>
          </div>

          <DataTable
            rows={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            onRowClick={(row) => void navigate(`/campanas/${row.campaign.id}`)}
            initialSort={{ key: 'due', direction: 'asc' }}
            emptyState={
              <EmptyState
                message={
                  showingOverdue
                    ? 'No hay ningún cobro vencido. Todo al día.'
                    : statusFilter
                      ? 'Ningún cobro con ese estatus en este mes.'
                      : 'No hay cobros programados en este mes.'
                }
                action={
                  showingOverdue || statusFilter ? undefined : (
                    <Button variant="outline" onClick={() => void navigate('/campanas/nueva')}>
                      Nueva campaña
                    </Button>
                  )
                }
              />
            }
          />
        </div>
      )}
    </>
  )
}
