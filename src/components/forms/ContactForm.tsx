import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Contact } from '@/types'

export type ContactDraft = {
  name: string
  role: string | null
  phone: string | null
  email: string | null
  linkedin: string | null
  is_primary: boolean
}

const EMPTY: ContactDraft = { name: '', role: '', phone: '', email: '', linkedin: '', is_primary: false }

export function ContactForm({
  open, contact, saving, onClose, onSave,
}: {
  open: boolean
  contact: Contact | null
  saving: boolean
  onClose: () => void
  onSave: (draft: ContactDraft) => void
}) {
  const [draft, setDraft] = useState<ContactDraft>(EMPTY)

  useEffect(() => {
    if (!open) return
    setDraft(contact
      ? {
          name: contact.name,
          role: contact.role ?? '',
          phone: contact.phone ?? '',
          email: contact.email ?? '',
          linkedin: contact.linkedin ?? '',
          is_primary: contact.is_primary,
        }
      : EMPTY)
  }, [open, contact])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{contact ? 'Editar contacto' : 'Nuevo contacto'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nombre</Label>
              <Input id="contact-name" value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-role">Puesto</Label>
              <Input id="contact-role" value={draft.role ?? ''}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Correo</Label>
              <Input id="contact-email" type="email" value={draft.email ?? ''}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Teléfono</Label>
              <Input id="contact-phone" value={draft.phone ?? ''}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-linkedin">LinkedIn</Label>
            <Input id="contact-linkedin" placeholder="https://" value={draft.linkedin ?? ''}
              onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} />
          </div>
          <label className="flex items-center gap-2.5 text-[15px]">
            <Checkbox checked={draft.is_primary}
              onCheckedChange={(checked) => setDraft({ ...draft, is_primary: checked === true })} />
            Es el contacto principal de la marca
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSave({
              ...draft,
              role: draft.role || null,
              phone: draft.phone || null,
              email: draft.email || null,
              linkedin: draft.linkedin || null,
            })}
            disabled={draft.name.trim().length < 2 || saving}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
