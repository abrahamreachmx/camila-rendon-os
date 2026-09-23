import { toIsoDate, type IsoDate } from '@/lib/dates'

export type PeriodType = 'mes' | 'trimestre' | 'rango'

export type PeriodRange = {
  type: PeriodType
  from: IsoDate
  to: IsoDate
  label: string
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** `month` es 1-12. */
export function monthRange(year: number, month: number): PeriodRange {
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0) // día 0 del mes siguiente = último día de este
  return {
    type: 'mes',
    from: toIsoDate(from),
    to: toIsoDate(to),
    label: `${capitalize(MONTHS[month - 1])} ${year}`,
  }
}

/** `quarter` es 1-4. */
export function quarterRange(year: number, quarter: number): PeriodRange {
  const firstMonth = (quarter - 1) * 3
  const from = new Date(year, firstMonth, 1)
  const to = new Date(year, firstMonth + 3, 0)
  return {
    type: 'trimestre',
    from: toIsoDate(from),
    to: toIsoDate(to),
    label: `Q${quarter} ${year}`,
  }
}

export function customRange(from: IsoDate, to: IsoDate): PeriodRange {
  return { type: 'rango', from, to, label: `${from} a ${to}` }
}

/** El periodo equivalente inmediatamente anterior, para calcular deltas. */
export function previousRange(range: PeriodRange): PeriodRange {
  if (range.type === 'mes') {
    const [year, month] = range.from.split('-').map(Number)
    return month === 1 ? monthRange(year - 1, 12) : monthRange(year, month - 1)
  }

  if (range.type === 'trimestre') {
    const [year, month] = range.from.split('-').map(Number)
    const quarter = Math.floor((month - 1) / 3) + 1
    return quarter === 1 ? quarterRange(year - 1, 4) : quarterRange(year, quarter - 1)
  }

  // Un rango libre se desplaza hacia atrás su misma longitud.
  const fromDate = new Date(`${range.from}T00:00:00`)
  const toDate = new Date(`${range.to}T00:00:00`)
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1
  const prevTo = new Date(fromDate)
  prevTo.setDate(prevTo.getDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setDate(prevFrom.getDate() - days + 1)
  return customRange(toIsoDate(prevFrom), toIsoDate(prevTo))
}

export function nextRange(range: PeriodRange): PeriodRange {
  if (range.type === 'mes') {
    const [year, month] = range.from.split('-').map(Number)
    return month === 12 ? monthRange(year + 1, 1) : monthRange(year, month + 1)
  }
  if (range.type === 'trimestre') {
    const [year, month] = range.from.split('-').map(Number)
    const quarter = Math.floor((month - 1) / 3) + 1
    return quarter === 4 ? quarterRange(year + 1, 1) : quarterRange(year, quarter + 1)
  }
  const fromDate = new Date(`${range.from}T00:00:00`)
  const toDate = new Date(`${range.to}T00:00:00`)
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1
  const nextFrom = new Date(toDate)
  nextFrom.setDate(nextFrom.getDate() + 1)
  const nextTo = new Date(nextFrom)
  nextTo.setDate(nextTo.getDate() + days - 1)
  return customRange(toIsoDate(nextFrom), toIsoDate(nextTo))
}

export function currentMonth(today = new Date()): PeriodRange {
  return monthRange(today.getFullYear(), today.getMonth() + 1)
}

export function currentQuarter(today = new Date()): PeriodRange {
  return quarterRange(today.getFullYear(), Math.floor(today.getMonth() / 3) + 1)
}

/** Delta porcentual contra el periodo anterior. `null` cuando no hay base de comparación. */
export function deltaPct(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}

/** Primer día del mes de una fecha, que es como se guarda el mes de cierre. */
export function toMonthStart(iso: IsoDate): IsoDate {
  return `${iso.slice(0, 7)}-01`
}

/** "septiembre 2026" a partir de un mes guardado como día primero. */
export function formatMonth(iso: IsoDate | null | undefined): string {
  if (!iso) return '—'
  const month = Number(iso.slice(5, 7))
  return `${MONTHS[month - 1]} ${iso.slice(0, 4)}`
}

/**
 * Meses que ofrece el selector de mes de cierre, del más reciente al más
 * antiguo. Arranca en 2025 porque ahí empieza el histórico cargado, y llega
 * hasta diciembre del año entrante para poder cerrar tratos por adelantado.
 */
export function monthOptions(today = new Date()): { value: IsoDate; label: string }[] {
  const out: { value: IsoDate; label: string }[] = []
  for (let year = today.getFullYear() + 1; year >= 2025; year -= 1) {
    for (let month = 12; month >= 1; month -= 1) {
      const value = `${year}-${String(month).padStart(2, '0')}-01`
      out.push({ value, label: `${capitalize(MONTHS[month - 1])} ${year}` })
    }
  }
  return out
}
