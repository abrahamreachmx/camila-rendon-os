import type { IsoDate } from '@/lib/dates'
import { AppError, fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { ReportSummary, SavedReport } from '@/types'

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
  period_type: 'mes' | 'trimestre' | 'rango'
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
