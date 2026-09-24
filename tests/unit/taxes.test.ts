import { describe, expect, it } from 'vitest'
import { collectibleAmount, grossFor, resicoBreakdown } from '@/lib/taxes'

describe('resicoBreakdown', () => {
  it('suma IVA 16 % y resta la retención de ISR 1.25 %', () => {
    expect(resicoBreakdown(100_000)).toEqual({
      subtotal: 100_000, iva: 16_000, isrRetention: 1_250, total: 114_750,
    })
  })

  it('redondea cada renglón a centavos, como la factura', () => {
    // 12,345.67 × 0.16 = 1,975.3072 → 1,975.31; × 0.0125 = 154.320875 → 154.32
    expect(resicoBreakdown(12_345.67)).toEqual({
      subtotal: 12_345.67, iva: 1_975.31, isrRetention: 154.32, total: 14_166.66,
    })
  })

  it('no devuelve NaN con valores inválidos', () => {
    expect(resicoBreakdown(Number.NaN).total).toBe(0)
  })
})

describe('grossFor', () => {
  it('sólo aplica impuestos en pesos', () => {
    expect(grossFor(100_000, 'MXN')).toBe(114_750)
    expect(grossFor(1_000, 'USD')).toBe(1_000)
    expect(grossFor(2_000_000, 'COP')).toBe(2_000_000)
    expect(grossFor(1_000, 'EUR')).toBe(1_000)
  })
})

describe('collectibleAmount', () => {
  it('en pesos cobra el bruto, aunque sea manual; en otras monedas el neto', () => {
    expect(collectibleAmount({ currency: 'MXN', gross_amount: 116_000, net_amount: 100_000 })).toBe(116_000)
    expect(collectibleAmount({ currency: 'USD', gross_amount: 1_200, net_amount: 1_000 })).toBe(1_000)
  })
})
