import { describe, expect, it } from 'vitest'
import {
  currentMonth,
  currentQuarter,
  customRange,
  deltaPct,
  monthRange,
  nextRange,
  previousRange,
  quarterRange,
} from '@/lib/periods'

describe('monthRange', () => {
  it('cubre el mes completo', () => {
    expect(monthRange(2026, 9)).toEqual({
      type: 'mes', from: '2026-09-01', to: '2026-09-30', label: 'Septiembre 2026',
    })
  })

  it('acierta con febrero, bisiesto o no', () => {
    expect(monthRange(2026, 2).to).toBe('2026-02-28')
    expect(monthRange(2028, 2).to).toBe('2028-02-29')
  })

  it('acierta con diciembre', () => {
    expect(monthRange(2026, 12)).toMatchObject({ from: '2026-12-01', to: '2026-12-31' })
  })
})

describe('quarterRange', () => {
  it('parte el año en cuatro', () => {
    expect(quarterRange(2026, 1)).toMatchObject({ from: '2026-01-01', to: '2026-03-31', label: 'Q1 2026' })
    expect(quarterRange(2026, 3)).toMatchObject({ from: '2026-07-01', to: '2026-09-30', label: 'Q3 2026' })
    expect(quarterRange(2026, 4)).toMatchObject({ from: '2026-10-01', to: '2026-12-31' })
  })
})

describe('previousRange', () => {
  it('retrocede un mes', () => {
    expect(previousRange(monthRange(2026, 9))).toMatchObject({ from: '2026-08-01', to: '2026-08-31' })
  })

  it('cruza el cambio de año hacia atrás', () => {
    expect(previousRange(monthRange(2026, 1))).toMatchObject({
      from: '2025-12-01', to: '2025-12-31', label: 'Diciembre 2025',
    })
    expect(previousRange(quarterRange(2026, 1))).toMatchObject({
      from: '2025-10-01', to: '2025-12-31', label: 'Q4 2025',
    })
  })

  it('retrocede un trimestre', () => {
    expect(previousRange(quarterRange(2026, 3))).toMatchObject({ from: '2026-04-01', to: '2026-06-30' })
  })

  it('desplaza un rango libre su misma longitud', () => {
    // 10 días: 10 al 19 -> 30-sep al 9-oct
    expect(previousRange(customRange('2026-10-10', '2026-10-19'))).toMatchObject({
      from: '2026-09-30', to: '2026-10-09',
    })
  })
})

describe('nextRange', () => {
  it('avanza mes y trimestre, cruzando el año', () => {
    expect(nextRange(monthRange(2026, 12))).toMatchObject({ from: '2027-01-01', label: 'Enero 2027' })
    expect(nextRange(quarterRange(2026, 4))).toMatchObject({ from: '2027-01-01', label: 'Q1 2027' })
  })

  it('ida y vuelta devuelve el punto de partida', () => {
    const q = quarterRange(2026, 3)
    expect(previousRange(nextRange(q))).toEqual(q)
  })
})

describe('currentMonth / currentQuarter', () => {
  it('usan la fecha dada', () => {
    const hoy = new Date(2026, 8, 18) // 18 de septiembre de 2026
    expect(currentMonth(hoy)).toMatchObject({ from: '2026-09-01', to: '2026-09-30' })
    expect(currentQuarter(hoy)).toMatchObject({ from: '2026-07-01', to: '2026-09-30', label: 'Q3 2026' })
  })
})

describe('deltaPct', () => {
  it('calcula la variación contra el periodo anterior', () => {
    expect(deltaPct(150, 100)).toBe(50)
    expect(deltaPct(75, 100)).toBe(-25)
    expect(deltaPct(100, 100)).toBe(0)
  })

  it('sin base de comparación devuelve null', () => {
    expect(deltaPct(100, 0)).toBeNull()
    expect(deltaPct(0, 0)).toBe(0)
  })
})
