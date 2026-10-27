import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { CommissionBreakdownSheet } from '@/components/data/CommissionBreakdownSheet'
import type { PaymentWithCampaign } from '@/types'

function cobro(id: string, paid: boolean, net: number): PaymentWithCampaign {
  return {
    id: `p-${id}`, amount: net, status: 'pendiente', due_date: '2026-10-30',
    campaign: {
      id, name: `Campaña ${id}`, currency: 'MXN', fx_rate_mxn: 1, company: { id: 'm', name: `Marca ${id}` },
      net_amount: net, commission_pct: 3, commission_paid: paid, plan: [{ amount: net }],
    },
  } as PaymentWithCampaign
}

const PAGOS = [cobro('a', false, 10_000), cobro('b', true, 20_000)]

function renderSheet(focus: 'pendiente' | 'todas', onClose = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<CommissionBreakdownSheet open onClose={onClose} payments={PAGOS} monthLabel="Octubre 2026" focus={focus} />} />
        <Route path="/campanas/:id" element={<p>Detalle de campaña</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return onClose
}

describe('CommissionBreakdownSheet', () => {
  it('desde la tarjeta muestra sólo las campañas con comisión pendiente', () => {
    renderSheet('pendiente')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Marca a')).toBeInTheDocument()
    expect(screen.queryByText('Marca b')).not.toBeInTheDocument()
    expect(screen.getByText(/Total · 1 campaña/)).toBeInTheDocument()
  })

  it('desde el resumen muestra todas, con total y por pagar', () => {
    renderSheet('todas')
    expect(screen.getByText('Marca b')).toBeInTheDocument()
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.getByText('Por pagar')).toBeInTheDocument()
  })

  it('al tocar una campaña cierra el panel y abre su detalle', () => {
    const onClose = renderSheet('pendiente')
    fireEvent.click(screen.getByText('Marca a'))
    expect(onClose).toHaveBeenCalled()
    expect(screen.getByText('Detalle de campaña')).toBeInTheDocument()
  })
})
