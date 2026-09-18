import { fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Gifting, GiftingStatus, Insert, Update } from '@/types'

export async function listGifting(
  filters: { status?: GiftingStatus | null } = {},
): Promise<(Gifting & { company: { id: string; name: string } | null })[]> {
  let query = supabase
    .from('gifting')
    .select('*, company:companies(id, name)')
    .order('created_at', { ascending: false })
  if (filters.status) query = query.eq('status', filters.status)
  return unwrap(await query) as unknown as (Gifting & { company: { id: string; name: string } | null })[]
}

export async function createGifting(input: Insert<'gifting'>): Promise<Gifting> {
  return unwrap(await supabase.from('gifting').insert(input).select('*').single())
}

export async function updateGifting(id: string, patch: Update<'gifting'>): Promise<Gifting> {
  return unwrap(await supabase.from('gifting').update(patch).eq('id', id).select('*').single())
}

export async function deleteGifting(id: string): Promise<void> {
  const { error } = await supabase.from('gifting').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}
