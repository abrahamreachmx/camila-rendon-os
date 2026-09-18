import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { MoneyCell } from '@/components/data/MoneyCell'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { createService, deleteService, listServices, reorderServices, updateService } from '@/lib/api/services'
import type { Currency } from '@/lib/money'
import type { Service } from '@/types'
import { ServiceDialog } from '@/routes/settings/tabs/ServiceDialog'

export function ServicesTab() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: services = [], isPending } = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices(),
  })

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['services'] })
  }

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateService(id, { active }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => { refresh(); toast.success('Servicio eliminado.') },
    onError: () => toast.error('No se pudo eliminar. Puede estar usado en una campaña; desactívalo en su lugar.'),
  })

  const move = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const next = [...services]
      const target = index + direction
      if (target < 0 || target >= next.length) return
      ;[next[index], next[target]] = [next[target], next[index]]
      await reorderServices(next.map((service) => service.id))
    },
    onSuccess: refresh,
  })

  const save = useMutation({
    mutationFn: async (input: Partial<Service> & { name: string }) =>
      editing
        ? updateService(editing.id, input)
        : createService({ ...input, sort_order: services.length + 1 }),
    onSuccess: () => {
      refresh()
      setEditing(null)
      setCreating(false)
      toast.success('Servicio guardado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const columns: Column<Service>[] = [
    {
      key: 'name',
      header: 'Servicio',
      sortValue: (row) => row.name,
      cell: (row) => (
        <button type="button" className="text-left hover:text-plum" onClick={() => setEditing(row)}>
          <span className="font-medium">{row.name}</span>
          {row.description && <span className="block text-[13px] text-ink-muted">{row.description}</span>}
        </button>
      ),
    },
    {
      key: 'price',
      header: 'Tarifa',
      align: 'right',
      sortValue: (row) => Number(row.default_price),
      cell: (row) => <MoneyCell amount={row.default_price} currency={row.currency as Currency} />,
    },
    {
      key: 'paid_media',
      header: 'Con pauta',
      hideOnMobile: true,
      cell: (row) => (row.paid_media_default ? 'Sí' : '—'),
    },
    {
      key: 'active',
      header: 'Activo',
      cell: (row) => (
        <Switch
          checked={row.active}
          onCheckedChange={(active) => toggleActive.mutate({ id: row.id, active })}
          aria-label={`Activar ${row.name}`}
        />
      ),
    },
    {
      key: 'order',
      header: 'Orden',
      align: 'right',
      hideOnMobile: true,
      cell: (row) => {
        const index = services.findIndex((service) => service.id === row.id)
        return (
          <span className="inline-flex gap-1">
            <Button variant="ghost" size="icon" aria-label="Subir" disabled={index === 0}
              onClick={() => move.mutate({ index, direction: -1 })}>
              <ArrowUp className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Bajar" disabled={index === services.length - 1}
              onClick={() => move.mutate({ index, direction: 1 })}>
              <ArrowDown className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Eliminar ${row.name}`}
              onClick={() => remove.mutate(row.id)}>
              <Trash2 className="size-4 text-overdue" />
            </Button>
          </span>
        )
      },
    },
  ]

  if (isPending) return <LoadingRows />

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          Los servicios inactivos no aparecen al armar una campaña ni al cotizar.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Nuevo servicio
        </Button>
      </div>

      <DataTable
        rows={services}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            message="Aún no hay tarifas. Crea la primera para poder cotizar."
            action={<Button onClick={() => setCreating(true)}>Nuevo servicio</Button>}
          />
        }
      />

      <ServiceDialog
        open={creating || editing !== null}
        service={editing}
        saving={save.isPending}
        onClose={() => { setCreating(false); setEditing(null) }}
        onSave={(input) => save.mutate(input)}
      />
    </div>
  )
}
