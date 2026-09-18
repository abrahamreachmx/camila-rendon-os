import { useQuery } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { MoneyCell } from '@/components/data/MoneyCell'
import { StatusBadge } from '@/components/data/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listCampaigns } from '@/lib/api/campaigns'
import { listCompanies } from '@/lib/api/companies'
import { listStatuses } from '@/lib/api/statuses'
import { calcCommission } from '@/lib/commission'
import { formatDateShort } from '@/lib/dates'
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
          <span className="font-heading text-[17px]">{row.name}</span>
          <span className="block text-[13px] text-ink-muted">{row.company?.name ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estatus',
      sortValue: (row) => row.status?.name ?? '',
      cell: (row) => (row.status ? <StatusBadge label={row.status.name} color={row.status.color} /> : '—'),
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
