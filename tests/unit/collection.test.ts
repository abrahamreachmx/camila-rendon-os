import { describe, expect, it } from 'vitest'
import { campaignPaymentStatus, collectionSortValue, summarizeMonthIncome } from '@/lib/collection'
import type { PaymentBrief, PaymentWithCampaign } from '@/types'

const HOY = '2026-09-21'

/** Un cobro de prueba. Por defecto vence en el futuro y está pendiente. */
function cobro(patch: Partial<PaymentBrief> = {}): PaymentBrief {
  return { amount: 1000, status: 'pendiente', due_date: '2026-12-01', ...patch } as PaymentBrief
}

describe('campaignPaymentStatus', () => {
  it('sin cobros programados devuelve sin_plan y todo en cero', () => {
    const r = campaignPaymentStatus([], HOY)
    expect(r.status).toBe('sin_plan')
    expect(r.paidPct).toBe(0)
    expect(r.total).toBe(0)
    expect(r.count).toBe(0)
    expect(r.hasOverdue).toBe(false)
  })

  it('todo cobrado devuelve pagado al 100 %', () => {
    const r = campaignPaymentStatus(
      [cobro({ status: 'pagado' }), cobro({ status: 'pagado' })],
      HOY,
    )
    expect(r.status).toBe('pagado')
    expect(r.paidPct).toBe(100)
    expect(r.hasOverdue).toBe(false)
  })

  it('nada cobrado y con vencimientos futuros devuelve pendiente', () => {
    const r = campaignPaymentStatus([cobro(), cobro()], HOY)
    expect(r.status).toBe('pendiente')
    expect(r.paidPct).toBe(0)
  })

  it('la mitad cobrada devuelve parcial al 50 %', () => {
    const r = campaignPaymentStatus([cobro({ status: 'pagado' }), cobro()], HOY)
    expect(r.status).toBe('parcial')
    expect(r.paidPct).toBe(50)
    expect(r.paid).toBe(1000)
    expect(r.total).toBe(2000)
  })

  it('parcial con un vencido sigue siendo parcial pero marca la bandera', () => {
    const r = campaignPaymentStatus(
      [cobro({ status: 'pagado' }), cobro({ due_date: '2026-08-01' })],
      HOY,
    )
    expect(r.status).toBe('parcial')
    expect(r.hasOverdue).toBe(true)
  })

  it('nada cobrado con un vencido devuelve vencido', () => {
    const r = campaignPaymentStatus([cobro({ due_date: '2026-08-01' }), cobro()], HOY)
    expect(r.status).toBe('vencido')
    expect(r.hasOverdue).toBe(true)
  })

  it('todos en proceso y al futuro devuelve en_proceso', () => {
    const r = campaignPaymentStatus(
      [cobro({ status: 'en_proceso' }), cobro({ status: 'en_proceso' })],
      HOY,
    )
    expect(r.status).toBe('en_proceso')
  })

  it('mezcla de en proceso y pendiente devuelve pendiente', () => {
    const r = campaignPaymentStatus([cobro({ status: 'en_proceso' }), cobro()], HOY)
    expect(r.status).toBe('pendiente')
  })

  it('lo vencido gana sobre en proceso', () => {
    const r = campaignPaymentStatus(
      [cobro({ status: 'en_proceso', due_date: '2026-08-01' }), cobro({ status: 'en_proceso' })],
      HOY,
    )
    expect(r.status).toBe('vencido')
  })

  it('con montos en cero mide el avance por número de cobros', () => {
    const r = campaignPaymentStatus(
      [cobro({ amount: 0, status: 'pagado' }), cobro({ amount: 0 }), cobro({ amount: 0 })],
      HOY,
    )
    expect(r.status).toBe('parcial')
    expect(r.paidPct).toBe(33)
    expect(Number.isFinite(r.paidPct)).toBe(true)
  })

  it('con montos en cero y todo pagado devuelve pagado', () => {
    const r = campaignPaymentStatus(
      [cobro({ amount: 0, status: 'pagado' }), cobro({ amount: 0, status: 'pagado' })],
      HOY,
    )
    expect(r.status).toBe('pagado')
    expect(r.paidPct).toBe(100)
  })

  it('un pago chico sobre un total grande nunca dice 0 %', () => {
    const r = campaignPaymentStatus(
      [cobro({ amount: 10, status: 'pagado' }), cobro({ amount: 99_990 })],
      HOY,
    )
    expect(r.paidPct).toBe(1)
  })

  it('casi todo cobrado nunca dice 100 % si falta algo', () => {
    const r = campaignPaymentStatus(
      [cobro({ amount: 99_999.99, status: 'pagado' }), cobro({ amount: 0.01 })],
      HOY,
    )
    expect(r.status).toBe('parcial')
    expect(r.paidPct).toBe(99)
  })

  it('un cobro pagado con fecha pasada no cuenta como vencido', () => {
    const r = campaignPaymentStatus([cobro({ status: 'pagado', due_date: '2026-01-01' })], HOY)
    expect(r.status).toBe('pagado')
    expect(r.hasOverdue).toBe(false)
  })

  it('un cobro que vence hoy todavía no está vencido', () => {
    const r = campaignPaymentStatus([cobro({ due_date: HOY })], HOY)
    expect(r.status).toBe('pendiente')
    expect(r.hasOverdue).toBe(false)
  })

  it('suma montos con decimales sin arrastrar error binario', () => {
    const rows = [
      cobro({ amount: 33.33, status: 'pagado' }),
      cobro({ amount: 33.33, status: 'pagado' }),
      cobro({ amount: 33.34, status: 'pagado' }),
    ]
    const r = campaignPaymentStatus(rows, HOY)
    expect(r.total).toBe(100)
    expect(r.paidPct).toBe(100)
  })
})

describe('collectionSortValue', () => {
  it('ordena por urgencia: vencido primero, sin plan al final', () => {
    const vencido = campaignPaymentStatus([cobro({ due_date: '2026-08-01' })], HOY)
    const parcialVencido = campaignPaymentStatus(
      [cobro({ status: 'pagado' }), cobro({ due_date: '2026-08-01' })],
      HOY,
    )
    const parcial = campaignPaymentStatus([cobro({ status: 'pagado' }), cobro()], HOY)
    const pendiente = campaignPaymentStatus([cobro()], HOY)
    const enProceso = campaignPaymentStatus([cobro({ status: 'en_proceso' })], HOY)
    const pagado = campaignPaymentStatus([cobro({ status: 'pagado' })], HOY)
    const sinPlan = campaignPaymentStatus([], HOY)

    const orden = [pagado, sinPlan, parcial, vencido, pendiente, enProceso, parcialVencido]
      .sort((a, b) => collectionSortValue(a) - collectionSortValue(b))
      .map((c) => c.status)

    expect(orden[0]).toBe('vencido')
    expect(orden[1]).toBe('parcial')
    expect(orden.at(-1)).toBe('sin_plan')
  })

  it('entre dos parciales va primero el menos cobrado', () => {
    const poco = campaignPaymentStatus(
      [cobro({ amount: 100, status: 'pagado' }), cobro({ amount: 900 })],
      HOY,
    )
    const mucho = campaignPaymentStatus(
      [cobro({ amount: 900, status: 'pagado' }), cobro({ amount: 100 })],
      HOY,
    )
    expect(collectionSortValue(poco)).toBeLessThan(collectionSortValue(mucho))
  })
})

describe('summarizeMonthIncome', () => {
  function pago(amount: number, currency: string, fx: number, patch: Partial<PaymentWithCampaign> = {}) {
    return {
      id: String(Math.random()),
      amount,
      status: 'pendiente',
      due_date: '2026-09-28',
      campaign: { id: 'c', name: 'C', currency, fx_rate_mxn: fx, company: null },
      ...patch,
    } as PaymentWithCampaign
  }

  it('separa esperado, cobrado y por cobrar, por moneda y en pesos', () => {
    const r = summarizeMonthIncome(
      [
        pago(10_000, 'MXN', 1, { status: 'pagado' }),
        pago(5_000, 'MXN', 1),
        pago(1_000, 'USD', 18.5),
      ],
      HOY,
    )
    expect(r.byCurrency).toEqual([
      { currency: 'MXN', expected: 15_000, paid: 10_000, pending: 5_000 },
      { currency: 'USD', expected: 1_000, paid: 0, pending: 1_000 },
    ])
    expect(r.mxn).toEqual({ expected: 33_500, paid: 10_000, pending: 23_500 })
    expect(r.overdueCount).toBe(0)
  })

  it('cuenta los vencidos y no se rompe sin cobros', () => {
    expect(summarizeMonthIncome([pago(100, 'MXN', 1, { due_date: '2026-09-02' })], HOY).overdueCount).toBe(1)
    expect(summarizeMonthIncome([], HOY)).toEqual({
      byCurrency: [], mxn: { expected: 0, paid: 0, pending: 0 }, overdueCount: 0,
    })
  })
})
