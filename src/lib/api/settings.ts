import { unwrap } from '@/lib/errors'
import type { PaymentPreset } from '@/lib/paymentPlan'
import { supabase } from '@/lib/supabase'
import type { Settings, Update } from '@/types'

export async function getSettings(): Promise<Settings> {
  return unwrap(
    await supabase.from('settings').select('*').eq('id', 1).single(),
    'No se encontró la configuración. ¿Corriste el seed?',
  )
}

export async function updateSettings(patch: Update<'settings'>): Promise<Settings> {
  return unwrap(await supabase.from('settings').update(patch).eq('id', 1).select('*').single())
}

/** Los presets viven como jsonb; se leen con forma tipada. */
export function readPresets(settings: Settings): PaymentPreset[] {
  const raw = settings.payment_presets
  if (!Array.isArray(raw)) return []
  return raw as unknown as PaymentPreset[]
}
