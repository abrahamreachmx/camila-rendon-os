import { describe, expect, it } from 'vitest'
import { composite, contrastRatio, parseHex, readableTextColor, toHex } from '@/lib/contrast'

describe('parseHex / toHex', () => {
  it('va y vuelve', () => {
    expect(parseHex('#6B2D4F')).toEqual([107, 45, 79])
    expect(toHex([107, 45, 79])).toBe('#6b2d4f')
    expect(parseHex('#abc')).toEqual([170, 187, 204])
  })

  it('tolera basura', () => {
    expect(parseHex('sin color')).toEqual([0, 0, 0])
  })
})

describe('contrastRatio', () => {
  it('blanco contra negro es 21:1', () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 1)
  })

  it('un color contra sí mismo es 1:1', () => {
    expect(contrastRatio([107, 45, 79], [107, 45, 79])).toBeCloseTo(1, 5)
  })
})

describe('readableTextColor', () => {
  const surfaces = [
    [255, 255, 255],
    [239, 231, 222],
    [247, 242, 236],
  ] as [number, number, number][]

  const palette = ['#C08A2E', '#3E7C5A', '#B4433B', '#3F5F8A', '#8B8079', '#6B2D4F']

  for (const hex of palette) {
    it(`${hex} queda legible sobre su tinte en todas las superficies`, () => {
      for (const surface of surfaces) {
        const text = readableTextColor(hex, { surface })
        const background = composite(parseHex(hex), 0.12, surface)
        expect(contrastRatio(parseHex(text), background)).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  it('deja intacto un color que ya cumple', () => {
    // La mora es lo bastante oscura de origen
    expect(readableTextColor('#6B2D4F').toLowerCase()).toBe('#6b2d4f')
  })

  it('oscurece un amarillo casi blanco hasta donde haga falta', () => {
    const text = readableTextColor('#FFEE88')
    const background = composite(parseHex('#FFEE88'), 0.12, [255, 255, 255])
    expect(contrastRatio(parseHex(text), background)).toBeGreaterThanOrEqual(4.5)
  })
})
