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
