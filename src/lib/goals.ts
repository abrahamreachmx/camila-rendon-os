import { diffDaysIso, todayIso, type IsoDate } from '@/lib/dates'
import { round2 } from '@/lib/money'
import type { PeriodRange } from '@/lib/periods'

/** Meta de venta de un año, medida sobre ventas netas consolidadas en pesos. */
export type SalesGoal = { year: number; target_net_mxn: number }

export type GoalProgress = {
  /** Meta prorrateada del periodo, en pesos. */
  target: number
  /** Ventas netas del periodo, en pesos. */
  actual: number
  /** Avance con un decimal. Sin tope: superar la meta debe verse. */
  pct: number
  remaining: number
  surplus: number
  daysTotal: number
  daysElapsed: number
  daysLeft: number
  /** Dónde debería ir hoy si el ritmo fuera parejo. */
  expectedToDate: number
  onTrack: boolean
  /** Cuánto hay que vender diario para cerrar el periodo en meta. */
  paceNeeded: number
  /** Proyección lineal al cierre del periodo. */
  projected: number
}

/**
 * Meta mensual: el anual entre doce, en partes iguales.
 * Redondear cada mes puede desviar el año hasta 0.12 pesos; es irrelevante y
 * preferible a arrastrar decimales en la interfaz.
 */
export function monthlyTarget(annual: number): number {
  if (!Number.isFinite(annual) || annual <= 0) return 0
  return round2(annual / 12)
}

/** Meta trimestral: el anual entre cuatro, para que los cuatro sumen el año. */
export function quarterlyTarget(annual: number): number {
  if (!Number.isFinite(annual) || annual <= 0) return 0
  return round2(annual / 4)
}

export function goalForYear(goals: readonly SalesGoal[], year: number): SalesGoal | null {
  return goals.find((goal) => goal.year === year) ?? null
}

/**
 * La meta que corresponde a un periodo. Mes, trimestre y año nunca cruzan año.
 * Un rango libre no se prorratea: devuelve null y la interfaz no muestra meta.
 */
export function targetForRange(goals: readonly SalesGoal[], range: PeriodRange): number | null {
  if (range.type === 'rango') return null
  const year = Number(range.from.slice(0, 4))
  const goal = goalForYear(goals, year)
  if (!goal) return null
  if (range.type === 'anio') return goal.target_net_mxn > 0 ? round2(goal.target_net_mxn) : 0
  return range.type === 'mes'
    ? monthlyTarget(goal.target_net_mxn)
    : quarterlyTarget(goal.target_net_mxn)
}

/** Avance contra la meta de un periodo. Ningún campo sale NaN ni Infinity. */
export function goalProgress({
  target,
  actual,
  range,
  today = todayIso(),
}: {
  target: number
  actual: number
  range: PeriodRange
  today?: IsoDate
}): GoalProgress {
  const safeTarget = Number.isFinite(target) && target > 0 ? round2(target) : 0
  const safeActual = Number.isFinite(actual) ? round2(actual) : 0

  const daysTotal = diffDaysIso(range.from, range.to) + 1
  const rawElapsed = diffDaysIso(range.from, today) + 1
  const daysElapsed = Math.max(0, Math.min(daysTotal, rawElapsed))
  const daysLeft = daysTotal - daysElapsed

  const pct = safeTarget > 0 ? Math.round((safeActual / safeTarget) * 1000) / 10 : 0
  const remaining = safeTarget > 0 ? round2(Math.max(0, safeTarget - safeActual)) : 0
  const surplus = safeTarget > 0 ? round2(Math.max(0, safeActual - safeTarget)) : 0

  const expectedToDate =
    safeTarget > 0 && daysTotal > 0 ? round2((safeTarget * daysElapsed) / daysTotal) : 0
  const onTrack = safeTarget === 0 ? true : safeActual >= expectedToDate
  const paceNeeded = remaining > 0 && daysLeft > 0 ? round2(remaining / daysLeft) : 0
  const projected = daysElapsed > 0 ? round2((safeActual / daysElapsed) * daysTotal) : 0

  return {
    target: safeTarget,
    actual: safeActual,
    pct,
    remaining,
    surplus,
    daysTotal,
    daysElapsed,
    daysLeft,
    expectedToDate,
    onTrack,
    paceNeeded,
    projected,
  }
}
