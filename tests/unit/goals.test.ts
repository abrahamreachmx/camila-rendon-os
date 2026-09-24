import { describe, expect, it } from 'vitest'
import {
  goalForYear,
  goalProgress,
  monthlyTarget,
  quarterlyTarget,
  targetForRange,
  type SalesGoal,
} from '@/lib/goals'
import { customRange, monthRange, quarterRange, yearRange } from '@/lib/periods'

const METAS: SalesGoal[] = [{ year: 2026, target_net_mxn: 3_600_000 }]

describe('prorrateo de la meta', () => {
  it('reparte el anual en partes iguales', () => {
    expect(monthlyTarget(3_600_000)).toBe(300_000)
    expect(quarterlyTarget(3_600_000)).toBe(900_000)
  })

  it('redondea a dos decimales cuando no divide exacto', () => {
    expect(monthlyTarget(1_000_000)).toBe(83_333.33)
    expect(quarterlyTarget(1_000_000)).toBe(250_000)
  })

  it('devuelve cero con valores inválidos en vez de NaN', () => {
    expect(monthlyTarget(0)).toBe(0)
    expect(monthlyTarget(-5)).toBe(0)
    expect(monthlyTarget(Number.NaN)).toBe(0)
    expect(quarterlyTarget(Number.NaN)).toBe(0)
  })
})

describe('targetForRange', () => {
  it('toma la meta mensual para un mes del año con meta', () => {
    expect(targetForRange(METAS, monthRange(2026, 9))).toBe(300_000)
  })

  it('toma la meta trimestral para un trimestre', () => {
    expect(targetForRange(METAS, quarterRange(2026, 3))).toBe(900_000)
  })

  it('toma la meta completa para el año', () => {
    expect(targetForRange(METAS, yearRange(2026))).toBe(3_600_000)
    expect(targetForRange(METAS, yearRange(2027))).toBeNull()
  })

  it('devuelve null si el año no tiene meta capturada', () => {
    expect(targetForRange(METAS, monthRange(2027, 1))).toBeNull()
    expect(targetForRange([], monthRange(2026, 1))).toBeNull()
  })

  it('no prorratea un rango libre', () => {
    expect(targetForRange(METAS, customRange('2026-01-05', '2026-03-10'))).toBeNull()
  })

  it('goalForYear encuentra el año o devuelve null', () => {
    expect(goalForYear(METAS, 2026)?.target_net_mxn).toBe(3_600_000)
    expect(goalForYear(METAS, 2030)).toBeNull()
  })
})

describe('goalProgress', () => {
  const septiembre = monthRange(2026, 9) // 30 días

  it('a mitad de mes y en ritmo lo reporta en ritmo', () => {
    const r = goalProgress({ target: 300_000, actual: 150_000, range: septiembre, today: '2026-09-15' })
    expect(r.daysTotal).toBe(30)
    expect(r.daysElapsed).toBe(15)
    expect(r.expectedToDate).toBe(150_000)
    expect(r.onTrack).toBe(true)
    expect(r.pct).toBe(50)
  })

  it('a mitad de mes y por debajo pide un ritmo diario mayor', () => {
    const r = goalProgress({ target: 300_000, actual: 90_000, range: septiembre, today: '2026-09-15' })
    expect(r.onTrack).toBe(false)
    expect(r.remaining).toBe(210_000)
    expect(r.daysLeft).toBe(15)
    expect(r.paceNeeded).toBe(14_000)
  })

  it('con la meta superada no pide más ritmo', () => {
    const r = goalProgress({ target: 300_000, actual: 324_300, range: septiembre, today: '2026-09-20' })
    expect(r.pct).toBeGreaterThan(100)
    expect(r.remaining).toBe(0)
    expect(r.surplus).toBe(24_300)
    expect(r.paceNeeded).toBe(0)
  })

  it('con el periodo ya cerrado la proyección es lo real', () => {
    const r = goalProgress({ target: 300_000, actual: 187_400, range: septiembre, today: '2026-11-02' })
    expect(r.daysElapsed).toBe(30)
    expect(r.daysLeft).toBe(0)
    expect(r.paceNeeded).toBe(0)
    expect(r.projected).toBe(187_400)
  })

  it('con el periodo aún por empezar no proyecta nada', () => {
    const r = goalProgress({ target: 300_000, actual: 0, range: septiembre, today: '2026-07-10' })
    expect(r.daysElapsed).toBe(0)
    expect(r.expectedToDate).toBe(0)
    expect(r.projected).toBe(0)
    expect(r.onTrack).toBe(true)
  })

  it('el primer día proyecta lo vendido por los días del periodo', () => {
    const r = goalProgress({ target: 300_000, actual: 10_000, range: septiembre, today: '2026-09-01' })
    expect(r.daysElapsed).toBe(1)
    expect(r.projected).toBe(300_000)
  })

  it('sin meta no divide entre cero', () => {
    const r = goalProgress({ target: 0, actual: 50_000, range: septiembre, today: '2026-09-15' })
    expect(r.pct).toBe(0)
    expect(r.onTrack).toBe(true)
    expect(r.paceNeeded).toBe(0)
  })

  it('cuenta bien los días de febrero bisiesto y no bisiesto', () => {
    const bisiesto = goalProgress({ target: 100, actual: 0, range: monthRange(2028, 2), today: '2028-02-10' })
    const normal = goalProgress({ target: 100, actual: 0, range: monthRange(2026, 2), today: '2026-02-10' })
    expect(bisiesto.daysTotal).toBe(29)
    expect(normal.daysTotal).toBe(28)
  })

  it('nunca devuelve NaN ni Infinity en ningún escenario', () => {
    const escenarios = [
      { target: 0, actual: 0, today: '2026-09-15' },
      { target: 300_000, actual: 0, today: '2026-09-01' },
      { target: 300_000, actual: 999_999, today: '2026-09-30' },
      { target: 300_000, actual: 1, today: '2026-07-01' },
      { target: Number.NaN, actual: Number.NaN, today: '2026-09-15' },
    ]
    for (const escenario of escenarios) {
      const r = goalProgress({ ...escenario, range: septiembre })
      for (const [key, value] of Object.entries(r)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} no es finito`).toBe(true)
        }
      }
    }
  })
})
