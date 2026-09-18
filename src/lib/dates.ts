/**
 * Fechas de negocio. En este sistema una fecha es un día del calendario
 * ("2026-10-15"), no un instante: si se pasara por `new Date(iso)` el runtime
 * la interpretaría como UTC y en México se correría un día hacia atrás.
 * Por eso todo se maneja como cadena `YYYY-MM-DD` y las fechas locales se
 * construyen siempre con el constructor de tres argumentos.
 */

export type IsoDate = string

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseIsoDate(iso: IsoDate): Date {
  const match = ISO_DATE.exec(iso)
  if (!match) throw new Error(`Fecha inválida: ${iso}`)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysIso(iso: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Diferencia en días completos entre dos fechas de calendario. */
export function diffDaysIso(from: IsoDate, to: IsoDate): number {
  const a = Date.UTC(...isoParts(from))
  const b = Date.UTC(...isoParts(to))
  return Math.round((b - a) / 86_400_000)
}

function isoParts(iso: IsoDate): [number, number, number] {
  const match = ISO_DATE.exec(iso)
  if (!match) throw new Error(`Fecha inválida: ${iso}`)
  return [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date())
}

export function isOverdue(dueDate: IsoDate, status: string, today: IsoDate = todayIso()): boolean {
  return status !== 'pagado' && dueDate < today
}

const LONG = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
const SHORT = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

export function formatDateLong(iso: IsoDate | null | undefined): string {
  if (!iso) return '—'
  return LONG.format(parseIsoDate(iso))
}

export function formatDateShort(iso: IsoDate | null | undefined): string {
  if (!iso) return '—'
  return SHORT.format(parseIsoDate(iso)).replace('.', '')
}
