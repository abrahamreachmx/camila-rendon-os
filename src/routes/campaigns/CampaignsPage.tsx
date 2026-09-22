import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router'
import { DataTable, type Column } from '@/components/data/DataTable'
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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listCampaigns, updateCampaign } from '@/lib/api/campaigns'
import { listCompanies } from '@/lib/api/companies'
import { listStatuses } from '@/lib/api/statuses'
import { campaignPaymentStatus, collectionSortValue } from '@/lib/collection'
import { calcCommission } from '@/lib/commission'
import { formatDateShort, todayIso } from '@/lib/dates'
import { CURRENCIES, type Currency } from '@/lib/money'
import type { CampaignListRow } from '@/types'

const ALL = 'todas'

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
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; status_id?: string } }) =>
      updateCampaign(id, patch),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      void queryClient.invalidateQueries({ queryKey: ['home'] })
      toast.success('Campaña actualizada.')
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
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          {row.status && <StatusBadge label={row.status.name} color={row.status.color} />}
          <Select
            value={row.status?.id ?? ''}
            onValueChange={(status_id) => edit.mutate({ id: row.id, patch: { status_id } })}
          >
            {/* Sólo el chevron: la insignia de al lado ya dice el estatus. */}
            <SelectTrigger
              className="size-8 shrink-0 justify-center p-0"
              aria-label={`Cambiar el estatus de ${row.name}`}
            />
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      cell: (row) => <MoneyCell amount={row.gross_amount} currency={row.currency as Currency} />,
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
        <span className="inline-flex items-center gap-1.5">
          <MoneyCell
            amount={calcCommission(Number(row.net_amount), Number(row.commission_pct))}
            currency={row.currency as Currency}
          />
          {row.commission_paid && <Check className="size-3.5 text-paid" aria-label="Comisión pagada" />}
        </span>
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
