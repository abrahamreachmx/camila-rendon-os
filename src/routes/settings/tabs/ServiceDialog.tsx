import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CURRENCIES } from '@/lib/money'
import type { Service } from '@/types'

type Draft = {
  name: string
  default_price: number
  currency: string
  paid_media_default: boolean
  description: string | null
  active: boolean
}

const EMPTY: Draft = {
  name: '', default_price: 0, currency: 'MXN',
  paid_media_default: false, description: '', active: true,
}

export function ServiceDialog({
  open, service, saving, onClose, onSave,
}: {
  open: boolean
  service: Service | null
  saving: boolean
  onClose: () => void
  onSave: (input: Draft) => void
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY)

  useEffect(() => {
    if (!open) return
    setDraft(
      service
        ? {
            name: service.name,
            default_price: Number(service.default_price),
            currency: service.currency,
            paid_media_default: service.paid_media_default,
            description: service.description ?? '',
            active: service.active,
          }
        : EMPTY,
    )
  }, [open, service])

  const invalid = draft.name.trim().length < 2

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Nombre</Label>
            <Input id="service-name" value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="service-price">Tarifa</Label>
              <Input id="service-price" type="number" min={0} step="1" value={draft.default_price}
                onChange={(e) => setDraft({ ...draft, default_price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-currency">Moneda</Label>
              <Select value={draft.currency} onValueChange={(currency) => setDraft({ ...draft, currency })}>
                <SelectTrigger id="service-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Descripción para la cotización</Label>
            <Textarea id="service-description" rows={3} value={draft.description ?? ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>

          <label className="flex items-center gap-2.5 text-[15px]">
            <Checkbox checked={draft.paid_media_default}
              onCheckedChange={(checked) => setDraft({ ...draft, paid_media_default: checked === true })} />
            Incluye pauta por defecto
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ ...draft, description: draft.description || null })}
            disabled={invalid || saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
