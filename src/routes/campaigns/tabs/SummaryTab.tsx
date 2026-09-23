import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CampaignFieldsForm, type CampaignFields } from '@/components/forms/CampaignFields'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCampaign } from '@/lib/api/campaigns'
import { formatDateLong } from '@/lib/dates'
import type { Currency } from '@/lib/money'
import type { CampaignWithRelations } from '@/types'

export function CampaignSummaryTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignWithRelations
  onSaved: () => void
}) {
  const [fields, setFields] = useState<CampaignFields>(toFields(campaign))
  const [net, setNet] = useState(String(campaign.net_amount))

  useEffect(() => {
    setFields(toFields(campaign))
    setNet(String(campaign.net_amount))
  }, [campaign])

  const save = useMutation({
    mutationFn: () => updateCampaign(campaign.id, { ...fields, net_amount: Number(net) }),
    onSuccess: () => { onSaved(); toast.success('Campaña actualizada.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const toggle = useMutation({
    mutationFn: (patch: Parameters<typeof updateCampaign>[1]) => updateCampaign(campaign.id, patch),
    onSuccess: onSaved,
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 rounded-lg border border-line bg-surface p-5">
        <label className="flex items-center gap-2.5 text-[15px]">
          <Checkbox checked={campaign.contract_signed}
            onCheckedChange={(checked) => toggle.mutate({ contract_signed: checked === true })} />
          Contrato firmado
        </label>
        <label className="flex items-center gap-2.5 text-[15px]">
          <Checkbox checked={campaign.produced}
            onCheckedChange={(checked) => toggle.mutate({ produced: checked === true })} />
          Contenido producido
        </label>
        <label className="flex items-center gap-2.5 text-[15px]">
          <Checkbox checked={campaign.commission_paid}
            onCheckedChange={(checked) => toggle.mutate({ commission_paid: checked === true })} />
          Comisión pagada
          {campaign.commission_paid && campaign.commission_paid_at && (
            <span className="text-[13px] text-ink-muted">· {formatDateLong(campaign.commission_paid_at)}</span>
          )}
        </label>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5">
        <div className="mb-5 max-w-[260px] space-y-2">
          <Label htmlFor="net-amount">Neto negociado ({campaign.currency as Currency})</Label>
          <Input id="net-amount" type="number" min="0" step="0.01" value={net}
            onChange={(event) => setNet(event.target.value)} />
          <p className="text-[13px] text-ink-muted">
            El bruto lo calculan los servicios. El neto se edita cuando hay descuento.
          </p>
        </div>

        <CampaignFieldsForm value={fields} onChange={(patch) => setFields({ ...fields, ...patch })} showStatus={false} />

        <Button className="mt-5" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}

function toFields(campaign: CampaignWithRelations): CampaignFields {
  return {
    company_id: campaign.company_id,
    contact_id: campaign.contact_id,
    name: campaign.name,
    status_id: campaign.status_id,
    currency: campaign.currency as Currency,
    fx_rate_mxn: Number(campaign.fx_rate_mxn),
    content_due_date: campaign.content_due_date,
    publish_date: campaign.publish_date,
    close_month: campaign.close_month,
    signed_at: campaign.signed_at,
    brief: campaign.brief,
    notes: campaign.notes,
  }
}
