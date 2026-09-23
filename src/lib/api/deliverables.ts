import { unwrap } from '@/lib/errors'
import { expandDeliverables } from '@/lib/deliverables'
import { supabase } from '@/lib/supabase'
import type { Deliverable, DeliverableWithCampaign, Update } from '@/types'

const WITH_CAMPAIGN =
  '*, campaign:campaigns!inner(id, name, company:companies(id, name))'

export async function listCampaignDeliverables(campaignId: string): Promise<Deliverable[]> {
  return unwrap(
    await supabase
      .from('campaign_deliverables')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('sort_order'),
  )
}

/** Las piezas que siguen debiéndose, para el Inicio. */
export async function listPendingDeliverables(): Promise<DeliverableWithCampaign[]> {
  return unwrap(
    await supabase
      .from('campaign_deliverables')
      .select(WITH_CAMPAIGN)
      .eq('delivered', false)
      .order('due_date', { nullsFirst: false }),
  ) as unknown as DeliverableWithCampaign[]
}

/**
 * Genera las piezas de una campaña a partir de sus servicios cotizados.
 * No hace nada si ya tiene entregables: regenerar borraría fechas y palomitas
 * que Ana ya capturó.
 */
export async function generateDeliverables(campaignId: string): Promise<Deliverable[]> {
  const existing = await listCampaignDeliverables(campaignId)
  if (existing.length > 0) return existing

  const items = unwrap(
    await supabase
      .from('campaign_items')
      .select('description, quantity')
      .eq('campaign_id', campaignId)
      .order('sort_order'),
  )
  const campaign = unwrap(
    await supabase.from('campaigns').select('*').eq('id', campaignId).single(),
  )

  const drafts = expandDeliverables(
    items.map((item) => ({ description: item.description, quantity: Number(item.quantity) })),
    campaign.content_due_date,
  )
  if (drafts.length === 0) return []

  return unwrap(
    await supabase
      .from('campaign_deliverables')
      .insert(drafts.map((draft) => ({ ...draft, campaign_id: campaignId })))
      .select('*'),
  )
}

export async function updateDeliverable(
  id: string,
  patch: Update<'campaign_deliverables'>,
): Promise<Deliverable> {
  // Marcar entregado sella la fecha si no viene una; desmarcar la borra.
  const sealed: Update<'campaign_deliverables'> = { ...patch }
  if (patch.delivered === false) sealed.delivered_at = null

  return unwrap(
    await supabase.from('campaign_deliverables').update(sealed).eq('id', id).select('*').single(),
  )
}

export async function deleteDeliverable(id: string): Promise<void> {
  const { error } = await supabase.from('campaign_deliverables').delete().eq('id', id)
  if (error) throw error
}
