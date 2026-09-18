import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { StatusBadge } from '@/components/data/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createStatus, deleteStatus, listStatuses, updateStatus } from '@/lib/api/statuses'
import type { CampaignStatus } from '@/types'

type Draft = { name: string; color: string; is_default: boolean; is_closed: boolean }
const EMPTY: Draft = { name: '', color: '#8B8079', is_default: false, is_closed: false }

export function StatusesTab() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<CampaignStatus | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<CampaignStatus | null>(null)
  const [reassignTo, setReassignTo] = useState<string>('')

  const { data: statuses = [], isPending } = useQuery({ queryKey: ['statuses'], queryFn: listStatuses })

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['statuses'] })
    void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  }

  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateStatus(editing.id, draft)
        : createStatus({ ...draft, sort_order: statuses.length + 1 }),
    onSuccess: () => { refresh(); setOpen(false); toast.success('Estatus guardado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: () => deleteStatus(deleting!.id, reassignTo || null),
    onSuccess: () => { refresh(); setDeleting(null); toast.success('Estatus eliminado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  function openDialog(status: CampaignStatus | null) {
    setEditing(status)
    setDraft(status
      ? { name: status.name, color: status.color, is_default: status.is_default, is_closed: status.is_closed }
      : EMPTY)
    setOpen(true)
  }

  const columns: Column<CampaignStatus>[] = [
    {
      key: 'name',
      header: 'Estatus',
      sortValue: (row) => row.sort_order,
      cell: (row) => (
        <button type="button" onClick={() => openDialog(row)}>
          <StatusBadge label={row.name} color={row.color} />
        </button>
      ),
    },
    { key: 'default', header: 'Por defecto', cell: (row) => (row.is_default ? 'Sí' : '—') },
    {
      key: 'closed',
      header: 'Cuenta como ejecutada',
      hideOnMobile: true,
      cell: (row) => (row.is_closed ? 'Sí' : '—'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <Button variant="ghost" size="icon" aria-label={`Eliminar ${row.name}`}
          onClick={() => { setDeleting(row); setReassignTo('') }}>
          <Trash2 className="size-4 text-overdue" />
        </Button>
      ),
    },
  ]

  if (isPending) return <LoadingRows rows={4} />

  const others = statuses.filter((status) => status.id !== deleting?.id)

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          Sólo un estatus puede ser el que toman las campañas nuevas.
        </p>
        <Button onClick={() => openDialog(null)}><Plus className="size-4" /> Nuevo estatus</Button>
      </div>

      <DataTable
        rows={statuses}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={<EmptyState message="No hay estatus. Crea el primero."
          action={<Button onClick={() => openDialog(null)}>Nuevo estatus</Button>} />}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar estatus' : 'Nuevo estatus'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status-name">Nombre</Label>
              <Input id="status-name" value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-color">Color</Label>
              <div className="flex items-center gap-3">
                <Input id="status-color" type="color" className="h-9 w-16 p-1" value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
                <StatusBadge label={draft.name || 'Vista previa'} color={draft.color} />
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-[15px]">
              <Checkbox checked={draft.is_default}
                onCheckedChange={(c) => setDraft({ ...draft, is_default: c === true })} />
              Es el estatus de las campañas nuevas
            </label>
            <label className="flex items-center gap-2.5 text-[15px]">
              <Checkbox checked={draft.is_closed}
                onCheckedChange={(c) => setDraft({ ...draft, is_closed: c === true })} />
              Cuenta como campaña ejecutada en los reportes
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={draft.name.trim().length < 2 || save.isPending}>
              {save.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar “{deleting?.name}”</AlertDialogTitle>
            <AlertDialogDescription>
              Las campañas que usan este estatus pasarán al que elijas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reassign">Reasignar campañas a</Label>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger id="reassign"><SelectValue placeholder="Sin estatus" /></SelectTrigger>
              <SelectContent>
                {others.map((status) => (
                  <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
