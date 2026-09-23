import { addDaysIso, parseIsoDate, toIsoDate, type IsoDate } from '@/lib/dates'

/**
 * Calendario laboral mexicano.
 *
 * Los feriados se derivan por año en vez de escribirse a mano, para que no haya
 * una lista que envejezca. Ojo con los tres que la ley mueve a lunes: el día de
 * asueto NO es el 5 de febrero, el 21 de marzo ni el 20 de noviembre, sino el
 * lunes que marca el artículo 74 de la Ley Federal del Trabajo. Ese es el día
 * que cierran los bancos, que es lo que importa para un cobro.
 */

/** El n-ésimo lunes de un mes (1 = el primero). */
function nthMonday(year: number, month: number, nth: number): IsoDate {
  const first = new Date(year, month - 1, 1)
  // getDay() da domingo=0, lunes=1.
  const shift = (8 - first.getDay()) % 7
  const day = 1 + shift + (nth - 1) * 7
  return toIsoDate(new Date(year, month - 1, day))
}

/**
 * Días de descanso obligatorio de México para un año.
 * El 1 de diciembre solo entra en años de transmisión del poder ejecutivo:
 * 2024 y luego cada seis años.
 */
export function mexicanHolidays(year: number): IsoDate[] {
  const fixed = [
    `${year}-01-01`, // Año nuevo
    `${year}-05-01`, // Día del trabajo
    `${year}-09-16`, // Independencia
    `${year}-12-25`, // Navidad
  ]
  const moved = [
    nthMonday(year, 2, 1), // conmemora el 5 de febrero
    nthMonday(year, 3, 3), // conmemora el 21 de marzo
    nthMonday(year, 11, 3), // conmemora el 20 de noviembre
  ]
  const transition = (year - 2024) % 6 === 0 && year >= 2024 ? [`${year}-12-01`] : []
  return [...fixed, ...moved, ...transition].sort()
}

const cache = new Map<number, Set<IsoDate>>()

function holidaySet(year: number): Set<IsoDate> {
  let set = cache.get(year)
  if (!set) {
    set = new Set(mexicanHolidays(year))
    cache.set(year, set)
  }
  return set
}

/** Un día hábil no es sábado, ni domingo, ni día de descanso obligatorio. */
export function isBusinessDay(iso: IsoDate): boolean {
  const day = parseIsoDate(iso).getDay()
  if (day === 0 || day === 6) return false
  return !holidaySet(Number(iso.slice(0, 4))).has(iso)
}

/** El mismo día si es hábil; si no, el siguiente que lo sea. */
export function nextBusinessDay(iso: IsoDate): IsoDate {
  let cursor = iso
  // Un puente nunca pasa de unos pocos días; el tope evita un ciclo infinito
  // si alguna vez se definiera un calendario absurdo.
  for (let guard = 0; guard < 30; guard += 1) {
    if (isBusinessDay(cursor)) return cursor
    cursor = addDaysIso(cursor, 1)
  }
  return cursor
}

/**
 * Suma días hábiles. Con `days = 0` devuelve la fecha base si es hábil, y si no
 * la recorre al siguiente hábil: un cobro no vence en domingo.
 */
export function addBusinessDaysIso(iso: IsoDate, days: number): IsoDate {
  if (days <= 0) return nextBusinessDay(iso)
  let cursor = iso
  let left = days
  while (left > 0) {
    cursor = addDaysIso(cursor, 1)
    if (isBusinessDay(cursor)) left -= 1
  }
  return cursor
}
