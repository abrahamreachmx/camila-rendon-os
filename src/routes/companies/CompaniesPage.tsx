import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { COMPANY_STAGE_STYLE, StatusBadge } from '@/components/data/StatusBadge'
import { CompanyForm, type CompanyDraft } from '@/components/forms/CompanyForm'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCompany, listCompanies } from '@/lib/api/companies'
import type { Company, CompanyStage } from '@/types'

const ALL = 'todas'

export default function CompaniesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)

  const stage = (params.get('etapa') as CompanyStage | null) ?? null
  const q = params.get('q') ?? ''

  const { data: companies = [], isPending } = useQuery({
    queryKey: ['companies', { stage, q }],
    queryFn: () => listCompanies({ stage, q }),
  })

  const create = useMutation({
    mutationFn: (draft: CompanyDraft) => createCompany(draft),
    onSuccess: (company) => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      setCreating(false)
      toast.success('Marca creada.')
      void navigate(`/marcas/${company.id}`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value && value !== ALL) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: 'Marca',
      sortValue: (row) => row.name,
      cell: (row) => <span className="font-heading text-[17px]">{row.name}</span>,
    },
    {
      key: 'stage',
      header: 'Etapa',
      sortValue: (row) => row.stage,
      cell: (row) => {
        const style = COMPANY_STAGE_STYLE[row.stage as CompanyStage]
        return <StatusBadge label={style.label} color={style.color} />
      },
    },
    {
      key: 'industry',
      header: 'Industria',
      hideOnMobile: true,
      sortValue: (row) => row.industry,
      cell: (row) => row.industry ?? '—',
    },
    {
      key: 'notes',
      header: 'Notas',
      hideOnMobile: true,
      cell: (row) => <span className="line-clamp-1 text-ink-muted">{row.notes ?? '—'}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Marcas"
        description="Prospectos, marcas en negociación y clientes."
        actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" /> Nueva marca</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="max-w-[260px]"
          placeholder="Buscar por nombre"
          value={q}
          onChange={(event) => setParam('q', event.target.value)}
        />
        <Select value={stage ?? ALL} onValueChange={(value) => setParam('etapa', value)}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por etapa"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las etapas</SelectItem>
            <SelectItem value="prospecto">Prospecto</SelectItem>
            <SelectItem value="negociando">Negociando</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <LoadingRows />
      ) : (
        <DataTable
          rows={companies}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => void navigate(`/marcas/${row.id}`)}
          emptyState={
            <EmptyState
              message={q || stage ? 'Ninguna marca coincide con el filtro.' : 'Aún no hay marcas. Crea la primera.'}
              action={<Button onClick={() => setCreating(true)}>Nueva marca</Button>}
            />
          }
        />
      )}

      <CompanyForm
        open={creating}
        company={null}
        saving={create.isPending}
        onClose={() => setCreating(false)}
        onSave={(draft) => create.mutate(draft)}
      />
    </>
  )
}
