import { todayIso, type IsoDate } from '@/lib/dates'
import { AppError, fromSupabaseError, unwrap } from '@/lib/errors'
import type { PaymentKpi } from '@/lib/kpiBreakdown'
import { supabase } from '@/lib/supabase'
import type { PaymentWithCampaign, ReportSummary, SavedReport } from '@/types'

const PAYMENT_WITH_CAMPAIGN =
  '*, campaign:campaigns!inner(id, name, currency, fx_rate_mxn, company:companies(id, name))'

/** El resumen lo calcula Postgres; el cliente nunca agrega en JS. */
export async function getReportSummary(from: IsoDate, to: IsoDate): Promise<ReportSummary> {
  const { data, error } = await supabase.rpc('report_summary', { from_date: from, to_date: to })
  if (error || !data) {
    throw new AppError('UNKNOWN', 'No se pudo calcular el reporte.', { cause: error })
  }
  return data as unknown as ReportSummary
}

export async function listReports(): Promise<SavedReport[]> {
  return unwrap(await supabase.from('reports').select('*').order('created_at', { ascending: false }))
}

export async function saveReport(input: {
  period_type: 'mes' | 'trimestre' | 'anio' | 'rango'
  period_start: IsoDate
  period_end: IsoDate
  title: string
  snapshot: ReportSummary
}): Promise<SavedReport> {
  return unwrap(
    await supabase
      .from('reports')
      .insert({ ...input, snapshot: input.snapshot as unknown as never })
      .select('*')
      .single(),
  )
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from('reports').delete().eq('id', id)
  if (error) throw fromSupabaseError(error)
}

export function readSnapshot(report: SavedReport): ReportSummary {
  return report.snapshot as unknown as ReportSummary
}

/**
 * Los cobros que componen Cobrado, Por cobrar o Vencido, con el mismo criterio
 * que report_summary (migración 0010). Sólo se piden al abrir el desglose.
 */
export async function listReportPayments(
  kpi: PaymentKpi,
  from: IsoDate,
  to: IsoDate,
  today: IsoDate = todayIso(),
): Promise<PaymentWithCampaign[]> {
  let query = supabase.from('payment_schedules').select(PAYMENT_WITH_CAMPAIGN)
  if (kpi === 'collected') {
    query = query.eq('status', 'pagado').gte('paid_at', from).lte('paid_at', to)
  } else if (kpi === 'pending') {
    query = query.neq('status', 'pagado').gte('due_date', from).lte('due_date', to)
  } else {
    // El RPC usa due_date < least(to_date, current_date).
    query = query.neq('status', 'pagado').lt('due_date', to < today ? to : today)
  }
  return unwrap(await query.order('due_date')) as unknown as PaymentWithCampaign[]
}
