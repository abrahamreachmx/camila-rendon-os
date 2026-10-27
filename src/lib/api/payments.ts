import { todayIso, type IsoDate } from '@/lib/dates'
import { fromSupabaseError, unwrap } from '@/lib/errors'
import type { PlanRow } from '@/lib/paymentPlan'
import { supabase } from '@/lib/supabase'
import type { Payment, PaymentStatus, PaymentWithCampaign, Update } from '@/types'

/** El cobro con su campaña, incluido lo necesario para calcular su comisión. */
export const PAYMENT_WITH_CAMPAIGN =
  '*, campaign:campaigns!inner(id, name, currency, fx_rate_mxn, net_amount, commission_pct, commission_paid, ' +
  'company:companies(id, name), plan:payment_schedules(amount))'
const WITH_CAMPAIGN = PAYMENT_WITH_CAMPAIGN

export async function listPayments(
  filters: { from?: IsoDate; to?: IsoDate; status?: PaymentStatus | null } = {},
): Promise<PaymentWithCampaign[]> {
  let query = supabase.from('payment_schedules').select(WITH_CAMPAIGN).order('due_date')
  if (filters.from) query = query.gte('due_date', filters.from)
  if (filters.to) query = query.lte('due_date', filters.to)
  if (filters.status) query = query.eq('status', filters.status)
  return unwrap(await query) as unknown as PaymentWithCampaign[]
}

/**
 * El dinero que entra en un periodo: lo cobrado en él (por fecha de pago) y
 * todo lo que falta cobrar con fecha hasta su fin, incluidos los vencidos de
 * meses anteriores. Un cobro que vence este mes pero se pagó el anterior ya no
 * entra. Mismo criterio que report_summary (migración 0013).
 */
export async function listMonthPayments(from: IsoDate, to: IsoDate): Promise<PaymentWithCampaign[]> {
  const [paid, unpaid] = await Promise.all([
    supabase.from('payment_schedules').select(WITH_CAMPAIGN).eq('status', 'pagado').gte('paid_at', from).lte('paid_at', to),
    supabase.from('payment_schedules').select(WITH_CAMPAIGN).neq('status', 'pagado').lte('due_date', to),
  ])
  const rows = [...unwrap(paid), ...unwrap(unpaid)] as unknown as PaymentWithCampaign[]
  return rows.sort((a, b) => a.due_date.localeCompare(b.due_date))
}

/** Todo lo que sigue sin cobrarse y ya venció. */
export async function listOverduePayments(today: IsoDate = todayIso()): Promise<PaymentWithCampaign[]> {
  return unwrap(
    await supabase
      .from('payment_schedules')
      .select(WITH_CAMPAIGN)
      .neq('status', 'pagado')
      .lt('due_date', today)
      .order('due_date'),
  ) as unknown as PaymentWithCampaign[]
}

export async function listCampaignPayments(campaignId: string): Promise<Payment[]> {
  return unwrap(
    await supabase
      .from('payment_schedules')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('sort_order')
      .order('due_date'),
  )
}

/**
 * Sustituye el plan de pagos. Las filas ya pagadas nunca se tocan:
 * borrar dinero cobrado sería perder información real.
 */
export async function replacePlan(campaignId: string, rows: PlanRow[]): Promise<Payment[]> {
  const { error: deleteError } = await supabase
    .from('payment_schedules')
    .delete()
    .eq('campaign_id', campaignId)
    .neq('status', 'pagado')
  if (deleteError) throw fromSupabaseError(deleteError)

  if (rows.length === 0) return listCampaignPayments(campaignId)

  const { error: insertError } = await supabase.from('payment_schedules').insert(
    rows.map((row) => ({
      campaign_id: campaignId,
      due_date: row.due_date,
      amount: row.amount,
      sort_order: row.sort_order,
    })),
  )
  if (insertError) throw fromSupabaseError(insertError)

  return listCampaignPayments(campaignId)
}

export async function updatePayment(id: string, patch: Update<'payment_schedules'>): Promise<Payment> {
  const next: Update<'payment_schedules'> = { ...patch }

  // Marcar como pagado sella la fecha; revertirlo la borra.
  if (patch.status === 'pagado' && patch.paid_at === undefined) {
    next.paid_at = todayIso()
  }
  if (patch.status && patch.status !== 'pagado') {
    next.paid_at = null
  }

  return unwrap(await supabase.from('payment_schedules').update(next).eq('id', id).select('*').single())
}

/**
 * Cambia de un golpe el estatus de todos los cobros de una campaña, desde la
 * tabla de campañas. Sólo toca los que están en otro estatus: un cobro que ya
 * estaba pagado conserva la fecha en que se pagó.
 */
export async function setCampaignPaymentsStatus(campaignId: string, status: PaymentStatus): Promise<void> {
  const { error } = await supabase
    .from('payment_schedules')
    .update({ status, paid_at: status === 'pagado' ? todayIso() : null })
    .eq('campaign_id', campaignId)
    .neq('status', status)
  if (error) throw fromSupabaseError(error)
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('payment_schedules').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}
