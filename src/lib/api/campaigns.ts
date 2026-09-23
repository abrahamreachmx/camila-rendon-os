import { AppError, fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type {
  CampaignItemInput,
  CampaignListRow,
  CampaignWithRelations,
  Insert,
  Update,
} from '@/types'
import { replaceItems } from '@/lib/api/campaignItems'
import { getSettings } from '@/lib/api/settings'
import { listStatuses } from '@/lib/api/statuses'

// Los cobros vienen embebidos para poder resumir el estatus de cobro en la lista
// sin una segunda consulta. Son pocas filas por campaña y el índice ya existe.
const LIST_SELECT =
  '*, company:companies(id, name), status:campaign_statuses(id, name, color, is_closed), ' +
  'payments:payment_schedules(amount, status, due_date)'

export async function listCampaigns(
  filters: {
    statusId?: string | null
    companyId?: string | null
    currency?: string | null
    q?: string | null
  } = {},
): Promise<CampaignListRow[]> {
  let query = supabase.from('campaigns').select(LIST_SELECT).order('created_at', { ascending: false })
  if (filters.statusId) query = query.eq('status_id', filters.statusId)
  if (filters.companyId) query = query.eq('company_id', filters.companyId)
  if (filters.currency) query = query.eq('currency', filters.currency)
  if (filters.q) query = query.ilike('name', `%${filters.q}%`)
  return unwrap(await query) as unknown as CampaignListRow[]
}

export async function getCampaign(id: string): Promise<CampaignWithRelations> {
  const campaign = unwrap(
    await supabase
      .from('campaigns')
      .select(
        '*, company:companies(id, name, stage), contact:contacts(id, name, email, phone), status:campaign_statuses(*)',
      )
      .eq('id', id)
      .single(),
    'No encontramos esa campaña.',
  )

  const [items, deliverables, payments, invoices, quotes] = await Promise.all([
    supabase.from('campaign_items').select('*').eq('campaign_id', id).order('sort_order'),
    supabase.from('campaign_deliverables').select('*').eq('campaign_id', id).order('sort_order'),
    supabase.from('payment_schedules').select('*').eq('campaign_id', id).order('sort_order').order('due_date'),
    supabase.from('invoices').select('*').eq('campaign_id', id).order('created_at', { ascending: false }),
    supabase.from('quotes').select('*').eq('campaign_id', id).order('issued_at', { ascending: false }),
  ])

  return {
    ...(campaign as unknown as CampaignWithRelations),
    items: unwrap(items),
    deliverables: unwrap(deliverables),
    payments: unwrap(payments),
    invoices: unwrap(invoices),
    quotes: unwrap(quotes),
  }
}

export type CreateCampaignInput = Omit<Insert<'campaigns'>, 'commission_pct' | 'status_id'> & {
  status_id?: string | null
  items?: CampaignItemInput[]
}

/**
 * Crea la campaña con la comisión vigente en Configuración (snapshot: cambiar
 * el porcentaje después no reescribe el histórico) y el estatus marcado como
 * default, y luego guarda el desglose de servicios.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<CampaignWithRelations> {
  const { items = [], ...campaignInput } = input

  const [settings, statuses] = await Promise.all([getSettings(), listStatuses()])
  const defaultStatus = statuses.find((status) => status.is_default) ?? statuses[0] ?? null

  const created = unwrap(
    await supabase
      .from('campaigns')
      .insert({
        ...campaignInput,
        commission_pct: settings.commission_pct,
        status_id: campaignInput.status_id ?? defaultStatus?.id ?? null,
      })
      .select('id')
      .single(),
  )

  if (items.length > 0) await replaceItems(created.id, items)

  return getCampaign(created.id)
}

export async function updateCampaign(id: string, patch: Update<'campaigns'>): Promise<void> {
  const next: Update<'campaigns'> = { ...patch }

  // Marcar la comisión como pagada sella la fecha; revertirlo la borra.
  if (patch.commission_paid === true && patch.commission_paid_at === undefined) {
    next.commission_paid_at = new Date().toISOString().slice(0, 10)
  }
  if (patch.commission_paid === false) {
    next.commission_paid_at = null
  }

  const { error } = await supabase.from('campaigns').update(next).eq('id', id)
  if (error) throw fromSupabaseError(error)
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}

export function assertFxRate(currency: string, fxRateMxn: number): void {
  if (currency === 'MXN' && fxRateMxn !== 1) {
    throw new AppError('VALIDATION', 'Una campaña en pesos mexicanos siempre lleva tipo de cambio 1.')
  }
  if (fxRateMxn <= 0) {
    throw new AppError('VALIDATION', 'El tipo de cambio debe ser mayor que cero.')
  }
}
