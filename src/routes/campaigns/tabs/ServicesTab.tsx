import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CampaignItemsEditor } from '@/components/forms/CampaignItemsEditor'
import { EmptyState } from '@/components/data/EmptyState'
import { Button } from '@/components/ui/button'
import { replaceItems } from '@/lib/api/campaignItems'
import { listServices } from '@/lib/api/services'
import type { Currency } from '@/lib/money'
import type { CampaignItemInput, CampaignWithRelations } from '@/types'

export function CampaignServicesTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignWithRelations
  onSaved: () => void
}) {
  const [items, setItems] = useState<CampaignItemInput[]>(() => toInputs(campaign))

  useEffect(() => { setItems(toInputs(campaign)) }, [campaign])

  const { data: services = [] } = useQuery({
    queryKey: ['services', { activeOnly: true }],
    queryFn: () => listServices({ activeOnly: true }),
  })

  const save = useMutation({
    mutationFn: () => replaceItems(campaign.id, items),
    onSuccess: () => { onSaved(); toast.success('Servicios guardados. El bruto se recalculó.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const incomplete = items.some((item) => item.description.trim().length < 2 || item.quantity <= 0)

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <EmptyState message="Esta campaña no tiene servicios. Agrégalos del catálogo o como línea libre." />
      )}

      <CampaignItemsEditor
        items={items}
        services={services}
        currency={campaign.currency as Currency}
        onChange={setItems}
      />

      <Button onClick={() => save.mutate()} disabled={save.isPending || incomplete}>
        {save.isPending ? 'Guardando…' : 'Guardar servicios'}
      </Button>
      {incomplete && <p className="text-[13px] text-overdue">Cada línea necesita descripción y cantidad mayor que cero.</p>}
    </div>
  )
}

function toInputs(campaign: CampaignWithRelations): CampaignItemInput[] {
  return campaign.items.map((item) => ({
    service_id: item.service_id,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    paid_media: item.paid_media,
    collab: item.collab,
  }))
}
