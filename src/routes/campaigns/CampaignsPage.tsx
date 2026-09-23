import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EditableMoneyCell } from '@/components/data/EditableMoneyCell'
import { EditableTextCell } from '@/components/data/EditableTextCell'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { MoneyCell } from '@/components/data/MoneyCell'
import {
  COLLECTION_STATUS_STYLE,
  PAYMENT_STATUS_STYLE,
  StatusBadge,
} from '@/components/data/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listCampaigns, updateCampaign } from '@/lib/api/campaigns'
import { generateDeliverables } from '@/lib/api/deliverables'
import { listCompanies } from '@/lib/api/companies'
import { listStatuses } from '@/lib/api/statuses'
import { campaignPaymentStatus, collectionSortValue } from '@/lib/collection'
import { calcCommission } from '@/lib/commission'
import { formatDateShort, todayIso } from '@/lib/dates'
import { formatMonth, monthOptions } from '@/lib/periods'
import { CURRENCIES, type Currency } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { CampaignListRow } from '@/types'

const ALL = 'todas'

/** El listado no cambia entre renders. */
const MESES = monthOptions()

export default function CampaignsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const statusId = params.get('estatus')
  const companyId = params.get('marca')
  const currency = params.get('moneda')
  const q = params.get('q') ?? ''

  const { data: campaigns = [], isPending } = useQuery({
    queryKey: ['campaigns', { statusId, companyId, currency, q }],
    queryFn: () => listCampaigns({ statusId, companyId, currency, q }),
  })
  const { data: statuses = [] } = useQuery({ queryKey: ['statuses'], queryFn: listStatuses })
  const { data: companies = [] } = useQuery({ queryKey: ['companies', {}], queryFn: () => listCompanies() })

  const queryClient = useQueryClient()

  /** Guarda un cambio hecho desde la tabla sin salir de la lista. */
  const edit = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: {
        name?: string
        status_id?: string
        commission_paid?: boolean
        close_month?: string | null
        gross_amount?: number
        gross_manual?: boolean
      }
    }) => {
      await updateCampaign(id, patch)
      // Capturar el mes de cierre significa que el trato se ganó: es el momento
      // de generar las piezas por entregar. Una campaña cancelada nunca llega aquí.
      if (patch.close_month) return generateDeliverables(id)
      return []
    },
    onSuccess: (created, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      void queryClient.invalidateQueries({ queryKey: ['home'] })
      void queryClient.invalidateQueries({ queryKey: ['report'] })
      void queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      toast.success(
        Array.isArray(created) && created.length > 0
          ? `Campaña actualizada. Se generaron ${created.length} entregables.`
          : 'Campaña actualizada.',
      )
    },
    onError: (error: Error) => toast.error(error.message),
  })

  // Se resuelve una vez por render: DataTable reordena y repinta las celdas.
  const today = todayIso()
  const collection = useMemo(
    () => new Map(campaigns.map((c) => [c.id, campaignPaymentStatus(c.payments ?? [], today)])),
    [campaigns, today],
  )

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value && value !== ALL) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const columns: Column<CampaignListRow>[] = [
    {
      key: 'name',
      header: 'Campaña',
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <EditableTextCell
            value={row.name}
            label="Nombre de la campaña"
            className="font-heading text-[17px]"
            onSave={(name) => edit.mutate({ id: row.id, patch: { name } })}
          />
          <span className="block px-1 text-[13px] text-ink-muted">{row.company?.name ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estatus',
      sortValue: (row) => row.status?.name ?? '',
      cell: (row) => (
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            {/* La insignia misma abre el menú: un clic encima y salen las opciones. */}
            <DropdownMenuTrigger
              aria-label={`Estatus de ${row.name}. Clic para cambiarlo.`}
              className="rounded-full focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none"
            >
              {row.status ? (
                <StatusBadge label={row.status.name} color={row.status.color} />
              ) : (
                <StatusBadge label="Sin estatus" color="#8B8079" />
              )}
            </DropdownMenuTrigger>
            {/* w-auto suelta el ancho del disparador, que es angosto. */}
            <DropdownMenuContent align="start" className="w-auto min-w-[220px]">
              {statuses.map((status) => (
                <DropdownMenuItem
                  key={status.id}
                  onSelect={() => edit.mutate({ id: row.id, patch: { status_id: status.id } })}
                  className="justify-between gap-3"
                >
                  <StatusBadge label={status.name} color={status.color} />
                  {status.id === row.status?.id && <Check className="size-4 text-plum" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    {
      key: 'close_month',
      header: 'Mes de cierre',
      sortValue: (row) => row.close_month ?? '',
      cell: (row) => (
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Mes de cierre de ${row.name}. Clic para cambiarlo.`}
              className={cn(
                'rounded-sm px-1 py-0.5 text-left whitespace-nowrap hover:bg-surface-2',
                'focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none',
                !row.close_month && 'text-ink-muted',
              )}
            >
              {row.close_month ? formatMonth(row.close_month) : 'Sin cerrar'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[320px] w-auto min-w-[180px] overflow-y-auto">
              <DropdownMenuItem
                onSelect={() => edit.mutate({ id: row.id, patch: { close_month: null } })}
                className="text-ink-muted"
              >
                Sin cerrar
              </DropdownMenuItem>
              {MESES.map((mes) => (
                <DropdownMenuItem
                  key={mes.value}
                  onSelect={() => edit.mutate({ id: row.id, patch: { close_month: mes.value } })}
                  className="justify-between gap-3"
                >
                  {mes.label}
                  {mes.value === row.close_month && <Check className="size-4 text-plum" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    {
      key: 'collection',
      header: 'Cobro',
      hideOnMobile: true,
      sortValue: (row) => collectionSortValue(collection.get(row.id)!),
      cell: (row) => {
        const c = collection.get(row.id)!
        const style = COLLECTION_STATUS_STYLE[c.status]
        // Lo vencido se distingue por color y por palabra: sólo por color sería
        // información inaccesible para quien no distingue el rojo.
        const label =
          c.status === 'parcial'
            ? `Parcial · ${c.paidPct} %${c.hasOverdue ? ' · vencido' : ''}`
            : style.label
        const color = c.hasOverdue ? PAYMENT_STATUS_STYLE.vencido.color : style.color
        return <StatusBadge label={label} color={color} />
      },
    },
    {
      key: 'gross',
      header: 'Bruto',
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => Number(row.gross_amount) * Number(row.fx_rate_mxn),
      // El bruto se captura a mano: cada país trae su IVA y sus retenciones, no hay
      // fórmula que sirva para todos. Marcarlo manual evita que editar servicios lo pise.
      cell: (row) => (
        <EditableMoneyCell
          value={Number(row.gross_amount)}
          currency={row.currency as Currency}
          label={`Bruto de ${row.name}`}
          onSave={(gross_amount) =>
            edit.mutate({ id: row.id, patch: { gross_amount, gross_manual: true } })
          }
        />
      ),
    },
    {
      key: 'net',
      header: 'Neto',
      align: 'right',
      sortValue: (row) => Number(row.net_amount) * Number(row.fx_rate_mxn),
      cell: (row) => <MoneyCell amount={row.net_amount} currency={row.currency as Currency} strong />,
    },
    {
      key: 'commission',
      header: 'Comisión',
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => calcCommission(Number(row.net_amount), Number(row.commission_pct)) * Number(row.fx_rate_mxn),
      cell: (row) => (
        <MoneyCell
          amount={calcCommission(Number(row.net_amount), Number(row.commission_pct))}
          currency={row.currency as Currency}
        />
      ),
    },
    {
      key: 'commission_paid',
      header: 'Comisión pagada',
      hideOnMobile: true,
      sortValue: (row) => (row.commission_paid ? 1 : 0),
      cell: (row) => (
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            checked={row.commission_paid}
            aria-label={`Comisión de ${row.name} pagada`}
            onCheckedChange={(value) =>
              edit.mutate({ id: row.id, patch: { commission_paid: value === true } })
            }
          />
        </div>
      ),
    },
    {
      key: 'publish',
      header: 'Publicación',
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.publish_date,
      cell: (row) => formatDateShort(row.publish_date),
    },
    {
      key: 'contract',
      header: 'Contrato',
      hideOnMobile: true,
      cell: (row) => (row.contract_signed ? <Check className="size-4 text-paid" aria-label="Firmado" /> : '—'),
    },
  ]

  const filtered = Boolean(statusId || companyId || currency || q)

  return (
    <>
      <PageHeader
        title="Campañas"
        description="Todo lo trabajado con marcas, con su desglose y su plan de cobro."
        actions={<Button onClick={() => void navigate('/campanas/nueva')}><Plus className="size-4" /> Nueva campaña</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-[240px]" placeholder="Buscar por nombre" value={q}
          onChange={(event) => setParam('q', event.target.value)} />

        <Select value={statusId ?? ALL} onValueChange={(value) => setParam('estatus', value)}>
          <SelectTrigger className="w-[190px]" aria-label="Filtrar por estatus"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estatus</SelectItem>
            {statuses.map((status) => <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={companyId ?? ALL} onValueChange={(value) => setParam('marca', value)}>
          <SelectTrigger className="w-[190px]" aria-label="Filtrar por marca"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las marcas</SelectItem>
            {companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={currency ?? ALL} onValueChange={(value) => setParam('moneda', value)}>
          <SelectTrigger className="w-[150px]" aria-label="Filtrar por moneda"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las monedas</SelectItem>
            {CURRENCIES.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <LoadingRows />
      ) : (
        <DataTable
          rows={campaigns}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => void navigate(`/campanas/${row.id}`)}
          emptyState={
            <EmptyState
              message={filtered ? 'Ninguna campaña coincide con los filtros.' : 'Aún no hay campañas. Crea la primera.'}
              action={<Button onClick={() => void navigate('/campanas/nueva')}>Nueva campaña</Button>}
            />
          }
        />
      )}
    </>
  )
}
