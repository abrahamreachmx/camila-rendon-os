import { fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { CampaignItem, CampaignItemInput } from '@/types'

/**
 * Reemplaza el desglose completo de una campaña. El trigger
 * `recalc_campaign_totals` recalcula el bruto; el cliente nunca lo escribe.
 */
export async function replaceItems(
  campaignId: string,
  items: CampaignItemInput[],
): Promise<CampaignItem[]> {
  const { error: deleteError } = await supabase
    .from('campaign_items')
    .delete()
    .eq('campaign_id', campaignId)
  if (deleteError) throw fromSupabaseError(deleteError)

  if (items.length === 0) return []

  return unwrap(
    await supabase
      .from('campaign_items')
      .insert(
        items.map((item, index) => ({
          campaign_id: campaignId,
          service_id: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          paid_media: item.paid_media,
          collab: item.collab,
          sort_order: index + 1,
        })),
      )
      .select('*'),
  )
}
