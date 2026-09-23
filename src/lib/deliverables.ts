import type { IsoDate } from '@/lib/dates'

/** Lo mínimo de una línea cotizada para poder expandirla en piezas. */
export type QuotedLine = {
  description: string
  quantity: number
}

export type DeliverableDraft = {
  description: string
  piece_number: number
  total_pieces: number
  due_date: IsoDate | null
  sort_order: number
}

/**
 * Convierte las líneas cotizadas de una campaña en piezas entregables.
 *
 * Una línea de tres Reels genera tres entregables numerados, porque Ana entrega
 * uno y queda a deber los otros. La cantidad admite decimales en el sistema, así
 * que se redondea hacia arriba y nunca se genera menos de una pieza.
 *
 * Ojo con el catálogo: "Historias de Instagram (set de 3)" es UNA unidad que
 * empaqueta tres piezas, así que genera un entregable. Para seguirlas por
 * separado hay que capturarlas como tres líneas.
 */
export function expandDeliverables(
  lines: readonly QuotedLine[],
  dueDate: IsoDate | null = null,
): DeliverableDraft[] {
  const out: DeliverableDraft[] = []
  let order = 0

  for (const line of lines) {
    const description = line.description.trim()
    if (description === '') continue

    const raw = Number(line.quantity)
    const total = Number.isFinite(raw) ? Math.max(1, Math.ceil(raw)) : 1

    for (let piece = 1; piece <= total; piece += 1) {
      order += 1
      out.push({
        description,
        piece_number: piece,
        total_pieces: total,
        due_date: dueDate,
        sort_order: order,
      })
    }
  }

  return out
}

/** "Reel de Instagram · 2 de 3", o sólo la descripción cuando la pieza es única. */
export function deliverableLabel(item: {
  description: string
  piece_number: number
  total_pieces: number
}): string {
  if (item.total_pieces <= 1) return item.description
  return `${item.description} · ${item.piece_number} de ${item.total_pieces}`
}
