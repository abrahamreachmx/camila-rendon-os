import { describe, expect, it } from 'vitest'
import { formatMoney, formatMoneyShort, parseMoney, round2, sumBy, toMxn } from '@/lib/money'

describe('round2', () => {
  it('redondea a dos decimales', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(1234.567)).toBe(1234.57)
    expect(round2(-1.005)).toBe(-1.01)
  })

  it('devuelve 0 ante valores no finitos', () => {
    expect(round2(Number.NaN)).toBe(0)
    expect(round2(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('sumBy', () => {
  it('no arrastra error binario', () => {
    expect(sumBy([0.1, 0.2, 0.3], (n) => n)).toBe(0.6)
  })

  it('suma líneas de una campaña', () => {
    const items = [
      { quantity: 3, unitPrice: 15000 },
      { quantity: 1, unitPrice: 6000 },
    ]
    expect(sumBy(items, (i) => i.quantity * i.unitPrice)).toBe(51000)
  })

  it('una lista vacía suma cero', () => {
    expect(sumBy([], (n: number) => n)).toBe(0)
  })
})

describe('toMxn', () => {
  it('consolida con el tipo de cambio de la campaña', () => {
    expect(toMxn(2000, 18.2)).toBe(36400)
    expect(toMxn(4_000_000, 0.0045)).toBe(18000)
    expect(toMxn(24000, 1)).toBe(24000)
  })
})

describe('formatMoney', () => {
  it('usa el símbolo y los decimales de cada moneda', () => {
    expect(formatMoney(18000, 'MXN')).toMatch(/18,000\.00/)
    expect(formatMoney(2000, 'USD')).toMatch(/2,000\.00/)
    // COP se muestra sin centavos
    expect(formatMoney(4_000_000, 'COP')).toMatch(/4,000,000/)
    expect(formatMoney(4_000_000, 'COP')).not.toMatch(/,00\b/)
  })
})

describe('formatMoneyShort', () => {
  it('compacta sólo a partir de 10 000', () => {
    expect(formatMoneyShort(9999, 'MXN')).toMatch(/9,999\.00/)
    expect(formatMoneyShort(153400, 'MXN')).toMatch(/153/)
  })
})

describe('parseMoney', () => {
  it('acepta lo que Ana escribiría', () => {
    expect(parseMoney('1,234.50')).toBe(1234.5)
    expect(parseMoney('$18 000')).toBe(18000)
    expect(parseMoney('1.234,50')).toBe(1234.5)
    expect(parseMoney('')).toBe(0)
    expect(parseMoney('abc')).toBe(0)
  })
})
