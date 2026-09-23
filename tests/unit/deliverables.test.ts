import { describe, expect, it } from 'vitest'
import { deliverableLabel, expandDeliverables } from '@/lib/deliverables'

describe('expandDeliverables', () => {
  it('una línea de tres genera tres piezas numeradas', () => {
    const piezas = expandDeliverables([{ description: 'Reel de Instagram', quantity: 3 }])
    expect(piezas).toHaveLength(3)
    expect(piezas.map((p) => p.piece_number)).toEqual([1, 2, 3])
    expect(piezas.every((p) => p.total_pieces === 3)).toBe(true)
    expect(piezas.every((p) => p.description === 'Reel de Instagram')).toBe(true)
  })

  it('una cantidad de uno genera una sola pieza', () => {
    const piezas = expandDeliverables([{ description: 'TikTok', quantity: 1 }])
    expect(piezas).toHaveLength(1)
    expect(piezas[0].total_pieces).toBe(1)
  })

  it('una cantidad con decimales redondea hacia arriba', () => {
    expect(expandDeliverables([{ description: 'Carrusel', quantity: 1.5 }])).toHaveLength(2)
    expect(expandDeliverables([{ description: 'Carrusel', quantity: 2.1 }])).toHaveLength(3)
  })

  it('una cantidad inválida o menor que uno genera una pieza', () => {
    expect(expandDeliverables([{ description: 'Reel', quantity: 0 }])).toHaveLength(1)
    expect(expandDeliverables([{ description: 'Reel', quantity: -2 }])).toHaveLength(1)
    expect(expandDeliverables([{ description: 'Reel', quantity: Number.NaN }])).toHaveLength(1)
  })

  it('sin líneas no genera nada', () => {
    expect(expandDeliverables([])).toEqual([])
  })

  it('descarta líneas sin descripción', () => {
    const piezas = expandDeliverables([
      { description: '   ', quantity: 2 },
      { description: 'Story', quantity: 1 },
    ])
    expect(piezas).toHaveLength(1)
    expect(piezas[0].description).toBe('Story')
  })

  it('copia la descripción tal cual, sólo recortando espacios', () => {
    const piezas = expandDeliverables([{ description: '  Colaboración en colab  ', quantity: 1 }])
    expect(piezas[0].description).toBe('Colaboración en colab')
  })

  it('numera el orden de forma continua entre líneas', () => {
    const piezas = expandDeliverables([
      { description: 'Reel', quantity: 2 },
      { description: 'TikTok', quantity: 2 },
    ])
    expect(piezas.map((p) => p.sort_order)).toEqual([1, 2, 3, 4])
    expect(piezas.map((p) => p.description)).toEqual(['Reel', 'Reel', 'TikTok', 'TikTok'])
  })

  it('siembra la fecha de compromiso en todas las piezas', () => {
    const piezas = expandDeliverables([{ description: 'Reel', quantity: 2 }], '2026-10-15')
    expect(piezas.every((p) => p.due_date === '2026-10-15')).toBe(true)
  })

  it('sin fecha las piezas nacen vacías', () => {
    expect(expandDeliverables([{ description: 'Reel', quantity: 1 }])[0].due_date).toBeNull()
  })
})

describe('deliverableLabel', () => {
  it('numera cuando hay varias piezas', () => {
    expect(deliverableLabel({ description: 'Reel', piece_number: 2, total_pieces: 3 }))
      .toBe('Reel · 2 de 3')
  })

  it('no numera cuando la pieza es única', () => {
    expect(deliverableLabel({ description: 'Reel', piece_number: 1, total_pieces: 1 }))
      .toBe('Reel')
  })
})
