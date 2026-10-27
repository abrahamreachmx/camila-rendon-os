import { describe, expect, it } from 'vitest'
import { calcCommission, paymentCommission } from '@/lib/commission'
import type { PaymentWithCampaign } from '@/types'

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

describe('paymentCommission', () => {
  function cobro(amount: number, campaign: Partial<PaymentWithCampaign['campaign']>) {
    return {
      amount,
      campaign: { net_amount: 100_000, commission_pct: 3, plan: [], ...campaign },
    } as unknown as PaymentWithCampaign
  }

  it('en pesos reparte el 3 % del neto aunque el plan vaya sobre el bruto RESICO', () => {
    // Bruto 114,750 en dos cobros iguales: cada uno lleva la mitad de 3,000.
    const plan = [{ amount: 57_375 }, { amount: 57_375 }]
    expect(paymentCommission(cobro(57_375, { plan }))).toBe(1_500)
  })

  it('reparte por peso con cobros desiguales, en la moneda de la campaña', () => {
    const plan = [{ amount: 3_000 }, { amount: 2_000 }]
    expect(paymentCommission(cobro(2_000, { net_amount: 5_000, plan }))).toBe(60)
  })

  it('sin plan, con plan en cero o sin comisión devuelve 0', () => {
    expect(paymentCommission(cobro(1_000, { plan: [] }))).toBe(0)
    expect(paymentCommission(cobro(0, { plan: [{ amount: 0 }] }))).toBe(0)
    expect(paymentCommission(cobro(1_000, { commission_pct: 0, plan: [{ amount: 1_000 }] }))).toBe(0)
  })
})
