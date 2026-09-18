import { fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Insert, Service, Update } from '@/types'

export async function listServices(options: { activeOnly?: boolean } = {}): Promise<Service[]> {
  let query = supabase.from('services').select('*').order('sort_order').order('name')
  if (options.activeOnly) query = query.eq('active', true)
  return unwrap(await query)
}

export async function createService(input: Insert<'services'>): Promise<Service> {
  return unwrap(await supabase.from('services').insert(input).select('*').single())
}

export async function updateService(id: string, patch: Update<'services'>): Promise<Service> {
  return unwrap(await supabase.from('services').update(patch).eq('id', id).select('*').single())
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}

/** Reordena el catálogo guardando el índice de cada servicio. */
export async function reorderServices(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id, index) => supabase.from('services').update({ sort_order: index + 1 }).eq('id', id)),
  )
}
