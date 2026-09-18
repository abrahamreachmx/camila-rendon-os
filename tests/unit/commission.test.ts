import { describe, expect, it } from 'vitest'
import { calcCommission } from '@/lib/commission'

describe('calcCommission', () => {
  it('calcula el porcentaje sobre el neto', () => {
    expect(calcCommission(24000, 20)).toBe(4800)
    expect(calcCommission(42000, 20)).toBe(8400)
    expect(calcCommission(2000, 20)).toBe(400)
  })

  it('redondea a dos decimales', () => {
    expect(calcCommission(1001, 15.5)).toBe(155.16)
    expect(calcCommission(333.33, 20)).toBe(66.67)
  })

  it('con 0 % o valores inválidos devuelve 0', () => {
    expect(calcCommission(24000, 0)).toBe(0)
    expect(calcCommission(24000, -5)).toBe(0)
    expect(calcCommission(Number.NaN, 20)).toBe(0)
  })
})
