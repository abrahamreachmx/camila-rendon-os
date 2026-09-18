import { addDaysIso, type IsoDate } from '@/lib/dates'
import { round2 } from '@/lib/money'

export type PaymentPreset = {
  key: string
  label: string
  parts: { pct: number; days: number }[]
}

export type PlanRow = {
  due_date: IsoDate
  amount: number
  sort_order: number
}

/**
 * Convierte un preset de plazos en filas de cobro.
 *
 * El reparto se redondea a 2 decimales y **la última fila absorbe la diferencia**,
 * de modo que la suma de las filas es exactamente `total` y nunca sobra ni falta
 * un centavo. Los porcentajes deben sumar 100.
 */
export function generatePaymentPlan(
  preset: PaymentPreset,
  baseDate: IsoDate,
  total: number,
): PlanRow[] {
  if (!preset.parts || preset.parts.length === 0) {
    throw new Error('El plazo de pago no tiene partes definidas.')
  }

  const pctSum = round2(preset.parts.reduce((acc, part) => acc + part.pct, 0))
  if (pctSum !== 100) {
    throw new Error(`Los porcentajes del plazo suman ${pctSum} % y deben sumar 100 %.`)
  }

  const roundedTotal = round2(total)
  const rows: PlanRow[] = []
  let assigned = 0

  preset.parts.forEach((part, index) => {
    const isLast = index === preset.parts.length - 1
    const amount = isLast ? round2(roundedTotal - assigned) : round2((roundedTotal * part.pct) / 100)
    assigned = round2(assigned + amount)
    rows.push({
      due_date: addDaysIso(baseDate, part.days),
      amount,
      sort_order: index + 1,
    })
  })

  return rows
}

/**
 * Regenerar un plan nunca puede borrar dinero ya cobrado: las filas pagadas se
 * conservan tal cual y el plan nuevo sólo reparte lo que falta por cobrar.
 */
export function mergePlanKeepingPaid(
  existing: { due_date: IsoDate; amount: number; status: string; id?: string }[],
  generated: PlanRow[],
): { kept: typeof existing; incoming: PlanRow[] } {
  const kept = existing.filter((row) => row.status === 'pagado')
  const offset = kept.length
  const incoming = generated.map((row, index) => ({ ...row, sort_order: offset + index + 1 }))
  return { kept, incoming }
}

/** Lo que falta por cobrar de una campaña una vez descontado lo ya pagado. */
export function remainingToCollect(
  total: number,
  existing: { amount: number; status: string }[],
): number {
  const paid = existing
    .filter((row) => row.status === 'pagado')
    .reduce((acc, row) => round2(acc + row.amount), 0)
  return round2(total - paid)
}
