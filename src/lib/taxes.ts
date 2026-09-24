import { round2, type Currency } from '@/lib/money'
import type { Campaign } from '@/types'

/**
 * Régimen fiscal de Camila: RESICO. En cada factura en pesos se agrega IVA
 * sobre el subtotal y la marca retiene ISR sobre ese mismo subtotal. Las
 * campañas en otras monedas se facturan al extranjero y no llevan ninguno.
 *
 * La misma aritmética vive en SQL (resico_total, migración 0012): si cambia
 * aquí, cambia allá.
 */
export const IVA_RATE = 0.16
export const ISR_RETENTION_RATE = 0.0125

export type ResicoBreakdown = {
  subtotal: number
  iva: number
  isrRetention: number
  /** Lo que paga la marca: subtotal + IVA − ISR retenido. Es el bruto. */
  total: number
}

/** Cada renglón se redondea por separado, como en la factura. */
export function resicoBreakdown(subtotal: number): ResicoBreakdown {
  const base = Number.isFinite(subtotal) ? round2(subtotal) : 0
  const iva = round2(base * IVA_RATE)
  const isrRetention = round2(base * ISR_RETENTION_RATE)
  return { subtotal: base, iva, isrRetention, total: round2(base + iva - isrRetention) }
}

/** El bruto que corresponde a un neto. Sólo los pesos llevan impuestos. */
export function grossFor(net: number, currency: Currency): number {
  return currency === 'MXN' ? resicoBreakdown(net).total : round2(net)
}

/**
 * Sobre qué monto se arma el plan de cobros. En pesos la marca paga el total
 * de la factura, que es el bruto (automático o capturado a mano). En las demás
 * monedas se cobra el neto, como siempre.
 */
export function collectibleAmount(
  campaign: Pick<Campaign, 'currency' | 'gross_amount' | 'net_amount'>,
): number {
  return round2(Number(campaign.currency === 'MXN' ? campaign.gross_amount : campaign.net_amount))
}
