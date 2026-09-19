import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { GIFTING_STATUS_STYLE, StatusBadge } from '@/components/data/StatusBadge'
import { GiftingForm, type GiftingDraft } from '@/components/forms/GiftingForm'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createGifting, deleteGifting, listGifting, updateGifting } from '@/lib/api/gifting'
import { formatDateShort } from '@/lib/dates'
import type { Gifting, GiftingStatus } from '@/types'

const ALL = 'todos'
type Row = Gifting & { company: { id: string; name: string } | null }

export default function GiftingPage() {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<Gifting | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Gifting | null>(null)

  const status = (params.get('estatus') as GiftingStatus | null) ?? null

  const { data: rows = [], isPending } = useQuery({
    queryKey: ['gifting', { status }],
    queryFn: () => listGifting({ status }),
  })

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['gifting'] })
    void queryClient.invalidateQueries({ queryKey: ['company'] })
  }

  const save = useMutation({
    mutationFn: (draft: GiftingDraft) => (editing ? updateGifting(editing.id, draft) : createGifting(draft)),
    onSuccess: () => { refresh(); setOpen(false); setEditing(null); toast.success('Gifting guardado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteGifting(id),
    onSuccess: () => { refresh(); setDeleting(null); toast.success('Gifting eliminado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const columns: Column<Row>[] = [
    {
      key: 'company',
      header: 'Marca',
      sortValue: (row) => row.company_name,
      cell: (row) => (
        <div className="min-w-0">
          {row.company ? (
            <Link to={`/marcas/${row.company.id}`} className="font-heading text-[17px] hover:text-plum">
              {row.company_name}
            </Link>
          ) : (
            <span className="font-heading text-[17px]">{row.company_name}</span>
          )}
          {row.contact_email && <span className="block text-[13px] text-ink-muted">{row.contact_email}</span>}
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Productos',
      cell: (row) => <span className="text-ink-muted">{row.products ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Estatus',
      sortValue: (row) => row.status,
      cell: (row) => {
        const style = GIFTING_STATUS_STYLE[row.status as GiftingStatus]
        return <StatusBadge label={style.label} color={style.color} />
      },
    },
    {
      key: 'received',
      header: 'Recibido',
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.received_at,
      cell: (row) => formatDateShort(row.received_at),
    },
    {
      key: 'links',
      header: 'Rastreo',
      hideOnMobile: true,
      cell: (row) =>
        row.tracking_links.length === 0 ? (
          '—'
        ) : (
          <span className="flex flex-col gap-1">
            {row.tracking_links.map((link, index) => (
              <a key={index} href={link} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] underline underline-offset-4 hover:text-plum">
                Guía {index + 1} <ExternalLink className="size-3" aria-hidden />
              </a>
            ))}
          </span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <span className="inline-flex gap-1">
          <Button variant="ghost" size="icon" aria-label={`Editar gifting de ${row.company_name}`}
            onClick={() => { setEditing(row); setOpen(true) }}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Eliminar gifting de ${row.company_name}`}
            onClick={() => setDeleting(row)}>
            <Trash2 className="size-4 text-overdue" />
          </Button>
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Gifting"
        description="Producto que llega de las marcas, con su guía de rastreo y su estatus."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true) }}>
            <Plus className="size-4" /> Nuevo gifting
          </Button>
        }
      />

      <div className="mb-4">
        <Select
          value={status ?? ALL}
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
            {Object.entries(GIFTING_STATUS_STYLE).map(([key, style]) => (
              <SelectItem key={key} value={key}>{style.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <LoadingRows />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              message={status ? 'Nada con ese estatus.' : 'Aún no hay gifting registrado. Agrega el primero.'}
              action={<Button onClick={() => { setEditing(null); setOpen(true) }}>Nuevo gifting</Button>}
            />
          }
        />
      )}

      <GiftingForm
        open={open}
        gifting={editing}
        saving={save.isPending}
        onClose={() => { setOpen(false); setEditing(null) }}
        onSave={(draft) => save.mutate(draft)}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar el gifting de “{deleting?.company_name}”</AlertDialogTitle>
            <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting.id)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
