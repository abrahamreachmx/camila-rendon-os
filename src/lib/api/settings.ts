import { unwrap } from '@/lib/errors'
import type { PaymentPreset } from '@/lib/paymentPlan'
import type { SalesGoal } from '@/lib/goals'
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

/**
 * Las metas viven como jsonb, igual que los presets. Se descartan las entradas
 * malformadas en lugar de reventar: una fila vieja no debe tumbar el Inicio.
 * Salen ordenadas por año descendente.
 */
export function readSalesGoals(settings: Settings): SalesGoal[] {
  const raw = settings.sales_goals
  if (!Array.isArray(raw)) return []
  return (raw as unknown as SalesGoal[])
    .filter(
      (goal) =>
        goal !== null &&
        typeof goal === 'object' &&
        Number.isFinite(Number(goal.year)) &&
        Number.isFinite(Number(goal.target_net_mxn)),
    )
    .map((goal) => ({ year: Number(goal.year), target_net_mxn: Number(goal.target_net_mxn) }))
    .sort((a, b) => b.year - a.year)
}

/** Guarda el arreglo completo, como los presets. */
export async function updateSalesGoals(goals: SalesGoal[]): Promise<Settings> {
  return updateSettings({ sales_goals: goals as unknown as never })
}

/** Los presets viven como jsonb; se leen con forma tipada. */
export function readPresets(settings: Settings): PaymentPreset[] {
  const raw = settings.payment_presets
  if (!Array.isArray(raw)) return []
  return raw as unknown as PaymentPreset[]
}
