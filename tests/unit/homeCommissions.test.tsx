// El Inicio de punta a punta con la API simulada: las dos entradas al desglose
// de comisiones abren el panel.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { PaymentWithCampaign } from '@/types'

const cobro = {
  id: 'p1', amount: 10_000, status: 'pendiente', due_date: '2026-10-30', paid_at: null,
  campaign: {
    id: 'c1', name: 'Campaña Uno', currency: 'MXN', fx_rate_mxn: 1, company: { id: 'm', name: 'Marca Uno' },
    net_amount: 10_000, commission_pct: 3, commission_paid: false, plan: [{ amount: 10_000 }],
  },
} as unknown as PaymentWithCampaign

vi.mock('@/lib/api/home', () => ({
  getHomeData: async () => ({
    today: '2026-10-27', overduePayments: [], overdueMxn: 0, dueThisMonthMxn: 10_000,
    pendingCommissionMxn: 300, monthPayments: [cobro], contentDue: [], publishing: [],
    inApproval: { statusName: 'Pendiente', campaigns: [] },
  }),
}))
vi.mock('@/lib/api/payments', () => ({ listPayments: async () => [], listMonthPayments: async () => [cobro] }))
vi.mock('@/lib/api/deliverables', () => ({ listPendingDeliverables: async () => [] }))
vi.mock('@/lib/api/reports', () => ({ getReportSummary: async () => null }))
vi.mock('@/lib/api/settings', () => ({ getSettings: async () => null, readSalesGoals: () => ({}) }))

const { default: HomePage } = await import('@/routes/home/HomePage')

function renderHome(path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}><HomePage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Inicio · comisiones', () => {
  it('la tarjeta Comisiones pendientes abre el desglose', async () => {
    renderHome()
    fireEvent.click(await screen.findByRole('button', { name: /Comisiones pendientes/ }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Marca Uno')).toBeInTheDocument()
  })

  it('Ver desglose del resumen abre el panel', async () => {
    renderHome('/?vista=resumen')
    fireEvent.click(await screen.findByRole('button', { name: /Ver desglose/ }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})
