import { useQuery } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { listCompanies } from '@/lib/api/companies'
import { todayIso } from '@/lib/dates'
import type { Gifting, GiftingStatus } from '@/types'

export type GiftingDraft = {
  company_id: string | null
  company_name: string
  contact_email: string | null
  products: string | null
  tracking_links: string[]
  status: GiftingStatus
  received_at: string | null
  notes: string | null
}

const NONE = 'sin-marca'

const EMPTY: GiftingDraft = {
  company_id: null, company_name: '', contact_email: '', products: '',
  tracking_links: [], status: 'propuesto', received_at: null, notes: '',
}

export function GiftingForm({
  open, gifting, saving, onClose, onSave,
}: {
  open: boolean
  gifting: Gifting | null
  saving: boolean
  onClose: () => void
  onSave: (draft: GiftingDraft) => void
}) {
  const [draft, setDraft] = useState<GiftingDraft>(EMPTY)
  const { data: companies = [] } = useQuery({ queryKey: ['companies', {}], queryFn: () => listCompanies() })

  useEffect(() => {
    if (!open) return
    setDraft(gifting
      ? {
          company_id: gifting.company_id,
          company_name: gifting.company_name,
          contact_email: gifting.contact_email ?? '',
          products: gifting.products ?? '',
          tracking_links: gifting.tracking_links ?? [],
          status: gifting.status as GiftingStatus,
          received_at: gifting.received_at,
          notes: gifting.notes ?? '',
        }
      : EMPTY)
  }, [open, gifting])

  /** Cambiar a "recibido" o "publicado" sin fecha la propone sola. */
  function setStatus(status: GiftingStatus) {
    const needsDate = status === 'recibido' || status === 'publicado'
    setDraft({ ...draft, status, received_at: needsDate ? (draft.received_at ?? todayIso()) : draft.received_at })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{gifting ? 'Editar gifting' : 'Nuevo gifting'}</DialogTitle></DialogHeader>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="gifting-company">Marca del CRM</Label>
            <Select
              value={draft.company_id ?? NONE}
              onValueChange={(value) => {
                if (value === NONE) { setDraft({ ...draft, company_id: null }); return }
                const company = companies.find((item) => item.id === value)
                setDraft({ ...draft, company_id: value, company_name: company?.name ?? draft.company_name })
              }}
            >
              <SelectTrigger id="gifting-company"><SelectValue placeholder="Sin vincular" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin vincular</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gifting-name">Nombre de la marca</Label>
            <Input id="gifting-name" value={draft.company_name}
              onChange={(e) => setDraft({ ...draft, company_name: e.target.value })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gifting-email">Correo de contacto</Label>
              <Input id="gifting-email" type="email" value={draft.contact_email ?? ''}
                onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gifting-status">Estatus</Label>
              <Select value={draft.status} onValueChange={(value) => setStatus(value as GiftingStatus)}>
                <SelectTrigger id="gifting-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="propuesto">Propuesto</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="recibido">Recibido</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                  <SelectItem value="declinado">Declinado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gifting-products">Productos</Label>
            <Textarea id="gifting-products" rows={2} value={draft.products ?? ''}
              onChange={(e) => setDraft({ ...draft, products: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gifting-received">Fecha de recepción</Label>
            <Input id="gifting-received" type="date" className="w-48" value={draft.received_at ?? ''}
              onChange={(e) => setDraft({ ...draft, received_at: e.target.value || null })} />
          </div>

          <div className="space-y-2">
            <Label>Ligas de rastreo</Label>
            {draft.tracking_links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input value={link} placeholder="https://" aria-label={`Liga de rastreo ${index + 1}`}
                  onChange={(e) => setDraft({
                    ...draft,
                    tracking_links: draft.tracking_links.map((item, i) => (i === index ? e.target.value : item)),
                  })} />
                <Button variant="ghost" size="icon" aria-label={`Quitar liga ${index + 1}`}
                  onClick={() => setDraft({
                    ...draft, tracking_links: draft.tracking_links.filter((_, i) => i !== index),
                  })}>
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm"
              onClick={() => setDraft({ ...draft, tracking_links: [...draft.tracking_links, ''] })}>
              <Plus className="size-4" /> Agregar liga
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gifting-notes">Notas</Label>
            <Textarea id="gifting-notes" rows={2} value={draft.notes ?? ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSave({
              ...draft,
              contact_email: draft.contact_email || null,
              products: draft.products || null,
              notes: draft.notes || null,
              tracking_links: draft.tracking_links.map((link) => link.trim()).filter(Boolean),
            })}
            disabled={draft.company_name.trim().length < 2 || saving}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
