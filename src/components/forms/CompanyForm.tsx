import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Company, CompanyStage } from '@/types'

export type CompanyDraft = {
  name: string
  stage: CompanyStage
  industry: string | null
  website: string | null
  notes: string | null
}

const EMPTY: CompanyDraft = { name: '', stage: 'prospecto', industry: '', website: '', notes: '' }

export function CompanyForm({
  open, company, saving, onClose, onSave,
}: {
  open: boolean
  company: Company | null
  saving: boolean
  onClose: () => void
  onSave: (draft: CompanyDraft) => void
}) {
  const [draft, setDraft] = useState<CompanyDraft>(EMPTY)

  useEffect(() => {
    if (!open) return
    setDraft(company
      ? {
          name: company.name,
          stage: company.stage as CompanyStage,
          industry: company.industry ?? '',
          website: company.website ?? '',
          notes: company.notes ?? '',
        }
      : EMPTY)
  }, [open, company])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{company ? 'Editar marca' : 'Nueva marca'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nombre</Label>
            <Input id="company-name" value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-stage">Etapa</Label>
              <Select value={draft.stage} onValueChange={(stage) => setDraft({ ...draft, stage: stage as CompanyStage })}>
                <SelectTrigger id="company-stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecto">Prospecto</SelectItem>
                  <SelectItem value="negociando">Negociando</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-industry">Industria</Label>
              <Input id="company-industry" value={draft.industry ?? ''}
                onChange={(e) => setDraft({ ...draft, industry: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website">Sitio web</Label>
            <Input id="company-website" placeholder="https://" value={draft.website ?? ''}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-notes">Notas</Label>
            <Textarea id="company-notes" rows={3} value={draft.notes ?? ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSave({
              ...draft,
              industry: draft.industry || null,
              website: draft.website || null,
              notes: draft.notes || null,
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
