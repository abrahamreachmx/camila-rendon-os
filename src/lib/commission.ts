import { round2 } from '@/lib/money'

/** Comisión de la manager sobre el neto de la campaña. */
export function calcCommission(net: number, pct: number): number {
  if (!Number.isFinite(net) || !Number.isFinite(pct)) return 0
  if (pct <= 0) return 0
  return round2((net * pct) / 100)
}
