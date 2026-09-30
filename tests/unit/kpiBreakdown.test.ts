import { describe, expect, it } from 'vitest'
import { campaignBreakdown, paymentBreakdown, reconciles } from '@/lib/kpiBreakdown'
import type { CampaignListRow, PaymentWithCampaign, ReportSummary } from '@/types'

function campana(patch: Partial<CampaignListRow>): CampaignListRow {
  return {
    id: String(Math.random()),
    name: 'C',
    currency: 'MXN',
    fx_rate_mxn: 1,
    net_amount: 0,
    gross_amount: 0,
    commission_pct: 3,
    company: { id: 'x', name: 'Marca' },
    status: null,
    ...patch,
  } as CampaignListRow
}

function resumen(patch: Partial<Record<'net' | 'gross' | 'comm' | 'avg' | 'total' | 'collected', number>>): ReportSummary {
  return {
    period: { from: '2026-01-01', to: '2026-12-31' },
    campaigns: { total: patch.total ?? 0 },
    sales: { net_mxn: patch.net ?? 0, gross_mxn: patch.gross ?? 0, avg_ticket_mxn: patch.avg ?? 0 },
    commissions: { generated_mxn: patch.comm ?? 0 },
    collections: { collected_mxn: patch.collected ?? 0, pending_mxn: 0, overdue_mxn: 0 },
  } as unknown as ReportSummary
}

const CAMPANAS = [
  campana({ name: 'Pesos', net_amount: 100_000, gross_amount: 114_750 }),
  campana({ name: 'Dólares', currency: 'USD', fx_rate_mxn: 18.5, net_amount: 1_000, gross_amount: 1_000 }),
]

describe('campaignBreakdown', () => {
  it('ventas netas: suma el neto en pesos, ordena de mayor a menor y cuadra', () => {
    const b = campaignBreakdown(CAMPANAS, 'net', resumen({ net: 118_500 }))
    expect(b.rows.map((r) => r.campaign)).toEqual(['Pesos', 'Dólares'])
    expect(b.totalMxn).toBe(118_500)
    expect(b.byCurrency).toEqual([
      { currency: 'MXN', amount: 100_000 },
      { currency: 'USD', amount: 1_000 },
    ])
    expect(reconciles(b, 'net')).toBe(true)
  })

  it('ventas brutas usa el bruto; comisiones, el % del neto por campaña', () => {
    expect(campaignBreakdown(CAMPANAS, 'gross', resumen({})).totalMxn).toBe(133_250)
    const c = campaignBreakdown(CAMPANAS, 'commissions', resumen({ comm: 3_555 }))
    expect(c.rows[0].amount).toBe(3_000)
    expect(c.totalMxn).toBe(3_555)
    expect(reconciles(c, 'commissions')).toBe(true)
  })

  it('ticket promedio y campañas cuadran contra el promedio y el conteo', () => {
    const b = campaignBreakdown(CAMPANAS, 'avg_ticket', resumen({ avg: 59_250 }))
    expect(reconciles(b, 'avg_ticket')).toBe(true)
    expect(reconciles(campaignBreakdown(CAMPANAS, 'campaigns', resumen({ total: 2 })), 'campaigns')).toBe(true)
    expect(reconciles(campaignBreakdown(CAMPANAS, 'campaigns', resumen({ total: 3 })), 'campaigns')).toBe(false)
  })

  it('avisa cuando no cuadra por más de un peso', () => {
    expect(reconciles(campaignBreakdown(CAMPANAS, 'net', resumen({ net: 118_502 })), 'net')).toBe(false)
  })
})

describe('paymentBreakdown', () => {
  it('cobrado toma la fecha de pago y convierte a pesos', () => {
    const pagos = [
      {
        id: 'p1', amount: 500, status: 'pagado', due_date: '2026-03-01', paid_at: '2026-03-05',
        campaign: { id: 'c1', name: 'C', currency: 'USD', fx_rate_mxn: 18, company: { id: 'x', name: 'M' } },
      },
    ] as unknown as PaymentWithCampaign[]
    const b = paymentBreakdown(pagos, 'collected', resumen({ collected: 9_000 }), () => ({ label: 'Pagado', color: '#000' }), '2026-09-30')
    expect(b.rows[0].date).toBe('2026-03-05')
    expect(b.totalMxn).toBe(9_000)
    expect(reconciles(b, 'collected')).toBe(true)
  })
})
