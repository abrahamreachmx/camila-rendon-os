import { fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Contact, Insert, Update } from '@/types'

export async function createContact(input: Insert<'contacts'>): Promise<Contact> {
  if (input.is_primary) await clearPrimary(input.company_id)
  return unwrap(await supabase.from('contacts').insert(input).select('*').single())
}

export async function updateContact(
  id: string,
  companyId: string,
  patch: Update<'contacts'>,
): Promise<Contact> {
  if (patch.is_primary) await clearPrimary(companyId, id)
  return unwrap(await supabase.from('contacts').update(patch).eq('id', id).select('*').single())
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}

/** Un índice único parcial garantiza un solo contacto principal por marca. */
async function clearPrimary(companyId: string, exceptId?: string): Promise<void> {
  let query = supabase
    .from('contacts')
    .update({ is_primary: false })
    .eq('company_id', companyId)
    .eq('is_primary', true)
  if (exceptId) query = query.neq('id', exceptId)
  const { error } = await query
  if (error) throw fromSupabaseError(error)
}
