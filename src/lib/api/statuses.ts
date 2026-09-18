import { AppError, fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { CampaignStatus, Insert, Update } from '@/types'

export async function listStatuses(): Promise<CampaignStatus[]> {
  return unwrap(await supabase.from('campaign_statuses').select('*').order('sort_order').order('name'))
}

export async function createStatus(input: Insert<'campaign_statuses'>): Promise<CampaignStatus> {
  if (input.is_default) await clearDefault()
  return unwrap(await supabase.from('campaign_statuses').insert(input).select('*').single())
}

export async function updateStatus(id: string, patch: Update<'campaign_statuses'>): Promise<CampaignStatus> {
  if (patch.is_default) await clearDefault(id)
  return unwrap(await supabase.from('campaign_statuses').update(patch).eq('id', id).select('*').single())
}

/**
 * Borra un estatus. Las campañas que lo usaban se reasignan primero: sin esto
 * la FK las dejaría con `status_id` nulo y desaparecerían de los filtros.
 */
export async function deleteStatus(id: string, reassignTo: string | null): Promise<void> {
  if (reassignTo === id) {
    throw new AppError('VALIDATION', 'No puedes reasignar las campañas al estatus que estás borrando.')
  }

  const { error: reassignError } = await supabase
    .from('campaigns')
    .update({ status_id: reassignTo })
    .eq('status_id', id)
  if (reassignError) throw fromSupabaseError(reassignError)

  const { error } = await supabase.from('campaign_statuses').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}

/** El índice único parcial sólo permite un default; hay que limpiarlo antes de poner otro. */
async function clearDefault(exceptId?: string): Promise<void> {
  let query = supabase.from('campaign_statuses').update({ is_default: false }).eq('is_default', true)
  if (exceptId) query = query.neq('id', exceptId)
  const { error } = await query
  if (error) throw fromSupabaseError(error)
}
