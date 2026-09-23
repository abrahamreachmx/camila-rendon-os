import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { listCompanies } from '@/lib/api/companies'
import { listStatuses } from '@/lib/api/statuses'
import { monthOptions } from '@/lib/periods'
import { supabase } from '@/lib/supabase'
import { CURRENCIES, type Currency } from '@/lib/money'
import type { Contact } from '@/types'

export type CampaignFields = {
  company_id: string
  contact_id: string | null
  name: string
  status_id: string | null
  currency: Currency
  fx_rate_mxn: number
  content_due_date: string | null
  publish_date: string | null
  close_month: string | null
  signed_at: string | null
  brief: string | null
  notes: string | null
}

const NONE = 'ninguno'

const MESES = monthOptions()

export function CampaignFieldsForm({
  value,
  onChange,
  showStatus = true,
}: {
  value: CampaignFields
  onChange: (patch: Partial<CampaignFields>) => void
  showStatus?: boolean
}) {
  const { data: companies = [] } = useQuery({ queryKey: ['companies', {}], queryFn: () => listCompanies() })
  const { data: statuses = [] } = useQuery({ queryKey: ['statuses'], queryFn: listStatuses })

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', value.company_id],
    queryFn: async (): Promise<Contact[]> => {
      const { data } = await supabase.from('contacts').select('*').eq('company_id', value.company_id).order('name')
      return data ?? []
    },
    enabled: Boolean(value.company_id),
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="campaign-company">Marca</Label>
          <Select
            value={value.company_id}
            onValueChange={(company_id) => onChange({ company_id, contact_id: null })}
          >
            <SelectTrigger id="campaign-company"><SelectValue placeholder="Elige una marca" /></SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign-contact">Contacto</Label>
          <Select
            value={value.contact_id ?? NONE}
            onValueChange={(id) => onChange({ contact_id: id === NONE ? null : id })}
            disabled={!value.company_id}
          >
            <SelectTrigger id="campaign-contact"><SelectValue placeholder="Sin contacto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin contacto</SelectItem>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}{contact.role ? ` · ${contact.role}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-name">Nombre de la campaña</Label>
        <Input id="campaign-name" value={value.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {showStatus && (
          <div className="space-y-2">
            <Label htmlFor="campaign-status">Estatus</Label>
            <Select value={value.status_id ?? NONE}
              onValueChange={(id) => onChange({ status_id: id === NONE ? null : id })}>
              <SelectTrigger id="campaign-status"><SelectValue placeholder="Por defecto" /></SelectTrigger>
              <SelectContent>
                {/* Sin esta opción el centinela no casa con ningún ítem y el
                    selector se ve vacío, igual que el bug de la tabla. */}
                <SelectItem value={NONE}>Por defecto</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="campaign-currency">Moneda</Label>
          <Select
            value={value.currency}
            onValueChange={(currency) =>
              onChange({ currency: currency as Currency, fx_rate_mxn: currency === 'MXN' ? 1 : value.fx_rate_mxn })
            }
          >
            <SelectTrigger id="campaign-currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {value.currency !== 'MXN' && (
          <div className="space-y-2">
            <Label htmlFor="campaign-fx">Tipo de cambio a MXN</Label>
            <Input id="campaign-fx" type="number" min="0.000001" step="0.0001" value={value.fx_rate_mxn}
              onChange={(e) => onChange({ fx_rate_mxn: Number(e.target.value) })} />
            <p className="text-[13px] text-ink-muted">Cuántos pesos vale 1 {value.currency}.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="campaign-signed">Fecha de firma</Label>
          <Input id="campaign-signed" type="date" value={value.signed_at ?? ''}
            onChange={(e) => onChange({ signed_at: e.target.value || null })} />
          <p className="text-[13px] text-ink-muted">Es la base del plan de pagos.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-due">Entrega de contenido</Label>
          <Input id="campaign-due" type="date" value={value.content_due_date ?? ''}
            onChange={(e) => onChange({ content_due_date: e.target.value || null })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-close">Mes de cierre</Label>
          <Select
            value={value.close_month ?? NONE}
            onValueChange={(mes) => onChange({ close_month: mes === NONE ? null : mes })}
          >
            <SelectTrigger id="campaign-close"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[320px]">
              <SelectItem value={NONE}>Sin cerrar</SelectItem>
              {MESES.map((mes) => (
                <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[13px] text-ink-muted">Mes en que se cerró el trato. Ubica la campaña en los reportes.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-publish">Publicación</Label>
          <Input id="campaign-publish" type="date" value={value.publish_date ?? ''}
            onChange={(e) => onChange({ publish_date: e.target.value || null })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-brief">Brief</Label>
        <Textarea id="campaign-brief" rows={3} value={value.brief ?? ''}
          onChange={(e) => onChange({ brief: e.target.value || null })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-notes">Notas</Label>
        <Textarea id="campaign-notes" rows={2} value={value.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value || null })} />
      </div>
    </div>
  )
}
