import { addDaysIso, todayIso } from '@/lib/dates'
import { AppError, fromSupabaseError, unwrap } from '@/lib/errors'
import { sumBy } from '@/lib/money'
import { supabase } from '@/lib/supabase'
import type { Quote, QuoteItemSnapshot } from '@/types'
import { getSettings } from '@/lib/api/settings'

export async function listQuotes(campaignId: string): Promise<Quote[]> {
  return unwrap(
    await supabase
      .from('quotes')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('issued_at', { ascending: false }),
  )
}

/**
 * Congela los servicios de la campaña en `items_snapshot`. A partir de aquí el
 * PDF se vuelve a dibujar siempre desde ese snapshot: editar la campaña después
 * no puede cambiar una cotización ya emitida.
 */
export async function createQuote(
  campaignId: string,
  options: { termsLabel: string; notes?: string | null },
): Promise<Quote> {
  const campaign = unwrap(
    await supabase.from('campaigns').select('id, currency').eq('id', campaignId).single(),
    'No encontramos esa campaña.',
  )

  const items = unwrap(
    await supabase
      .from('campaign_items')
      .select('description, quantity, unit_price, line_total, paid_media, collab')
      .eq('campaign_id', campaignId)
      .order('sort_order'),
  )

  if (items.length === 0) {
    throw new AppError('VALIDATION', 'Agrega al menos un servicio antes de cotizar.')
  }

  const snapshot: QuoteItemSnapshot[] = items.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total ?? 0),
    paid_media: item.paid_media,
    collab: item.collab,
  }))

  const { data: folio, error: folioError } = await supabase.rpc('next_quote_folio')
  if (folioError || !folio) {
    throw new AppError('UNKNOWN', 'No se pudo generar el folio de la cotización.', { cause: folioError })
  }

  const settings = await getSettings()
  const issuedAt = todayIso()

  return unwrap(
    await supabase
      .from('quotes')
      .insert({
        campaign_id: campaignId,
        folio,
        issued_at: issuedAt,
        valid_until: addDaysIso(issuedAt, settings.quote_validity_days),
        currency: campaign.currency,
        items_snapshot: snapshot,
        total: sumBy(snapshot, (item) => item.line_total),
        payment_terms_label: options.termsLabel,
        notes: options.notes ?? null,
      })
      .select('*')
      .single(),
  )
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}

export function readQuoteItems(quote: Quote): QuoteItemSnapshot[] {
  const raw = quote.items_snapshot
  return Array.isArray(raw) ? (raw as unknown as QuoteItemSnapshot[]) : []
}
