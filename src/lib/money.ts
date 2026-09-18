/**
 * Dinero. Reglas duras:
 * - nunca se suman floats sin redondear
 * - todo cálculo de negocio pasa por `round2`
 * - los montos viven en la moneda de la campaña; `toMxn` consolida
 */

export const CURRENCIES = ['MXN', 'USD', 'COP'] as const
export type Currency = (typeof CURRENCIES)[number]

/** Redondeo a 2 decimales, estable para los errores binarios típicos (1.005 → 1.01). */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON * Math.sign(value) * Math.abs(value)) * 100) / 100
}

/** Suma redondeando cada término y el total: evita 0.1 + 0.2 = 0.30000000000000004. */
export function sumBy<T>(items: readonly T[], pick: (item: T) => number): number {
  return round2(items.reduce((acc, item) => round2(acc + round2(pick(item))), 0))
}

/** Convierte a MXN con el tipo de cambio guardado en la campaña. */
export function toMxn(amount: number, fxRateMxn: number): number {
  return round2(amount * fxRateMxn)
}

const FORMATTERS = new Map<string, Intl.NumberFormat>()

function formatter(currency: Currency, fractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`
  let f = FORMATTERS.get(key)
  if (!f) {
    f = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    FORMATTERS.set(key, f)
  }
  return f
}

/**
 * Formatea un importe. Los pesos colombianos se muestran sin centavos porque
 * en la práctica siempre son cifras enteras y con decimales se vuelven ilegibles.
 */
export function formatMoney(amount: number, currency: Currency = 'MXN'): string {
  const digits = currency === 'COP' ? 0 : 2
  return formatter(currency, digits).format(round2(amount))
}

/** Versión compacta para tarjetas y la línea de cobros: $153.4k */
export function formatMoneyShort(amount: number, currency: Currency = 'MXN'): string {
  const abs = Math.abs(amount)
  if (abs < 10_000) return formatMoney(amount, currency)
  const compact = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  })
  return compact.format(amount)
}

/** Lee un importe escrito a mano: acepta "1,234.50", "$1 234.50" y "1234,50". */
export function parseMoney(input: string): number {
  const cleaned = input.replace(/[^\d.,-]/g, '').trim()
  if (cleaned === '') return 0
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  let normalized: string
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned.replace(/,/g, '')
  }
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? round2(value) : 0
}
