import { fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Company, CompanyStage, CompanyWithRelations, Insert, Update } from '@/types'

export async function listCompanies(
  filters: { stage?: CompanyStage | null; q?: string | null } = {},
): Promise<Company[]> {
  let query = supabase.from('companies').select('*').order('name')
  if (filters.stage) query = query.eq('stage', filters.stage)
  if (filters.q) query = query.ilike('name', `%${filters.q}%`)
  return unwrap(await query)
}

export async function getCompany(id: string): Promise<CompanyWithRelations> {
  const company = unwrap(
    await supabase.from('companies').select('*').eq('id', id).single(),
    'No encontramos esa marca.',
  )

  const [contacts, campaigns, gifting] = await Promise.all([
    supabase.from('contacts').select('*').eq('company_id', id).order('is_primary', { ascending: false }).order('name'),
    supabase
      .from('campaigns')
      .select('*, company:companies(id, name), status:campaign_statuses(id, name, color, is_closed)')
      .eq('company_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('gifting').select('*').eq('company_id', id).order('created_at', { ascending: false }),
  ])

  return {
    ...company,
    contacts: unwrap(contacts),
    campaigns: unwrap(campaigns) as CompanyWithRelations['campaigns'],
    gifting: unwrap(gifting),
  }
}

export async function createCompany(input: Insert<'companies'>): Promise<Company> {
  return unwrap(await supabase.from('companies').insert(input).select('*').single())
}

export async function updateCompany(id: string, patch: Update<'companies'>): Promise<Company> {
  return unwrap(await supabase.from('companies').update(patch).eq('id', id).select('*').single())
}

/** La FK de campañas es `restrict`: si la marca tiene campañas, esto falla a propósito. */
export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}
