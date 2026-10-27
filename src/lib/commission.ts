import { round2 } from '@/lib/money'
import type { PaymentWithCampaign } from '@/types'

/** Comisión de la manager sobre el neto de la campaña. */
export function calcCommission(net: number, pct: number): number {
  if (!Number.isFinite(net) || !Number.isFinite(pct)) return 0
  if (pct <= 0) return 0
  return round2((net * pct) / 100)
}

/**
 * La parte de la comisión de la campaña que le toca a un cobro, en la moneda
 * de la campaña: su peso en el plan de pagos. Proporcional porque en pesos los
 * cobros van sobre el bruto RESICO y la comisión sobre el neto. Es la misma
 * cuenta que report_summary (migración 0013).
 */
export function paymentCommission(payment: Pick<PaymentWithCampaign, 'amount' | 'campaign'>): number {
  const { net_amount, commission_pct, plan } = payment.campaign
  const net = Number(net_amount)
  const pct = Number(commission_pct)
  const planTotal = (plan ?? []).reduce((acc, row) => acc + Number(row.amount), 0)
  if (!Number.isFinite(net) || !Number.isFinite(pct) || pct <= 0 || !(planTotal > 0)) return 0
  return round2((((net * pct) / 100) * Number(payment.amount)) / planTotal)
}
