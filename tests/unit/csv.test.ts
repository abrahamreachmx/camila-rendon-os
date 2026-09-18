import { describe, expect, it } from 'vitest'
import { toCsv, type CsvColumn } from '@/lib/csv'

type Row = { marca: string; campana: string; neto: number; notas: string | null }

const columns: CsvColumn<Row>[] = [
  { header: 'Marca', value: (r) => r.marca },
  { header: 'Campaña', value: (r) => r.campana },
  { header: 'Neto', value: (r) => r.neto },
  { header: 'Notas', value: (r) => r.notas },
]

describe('toCsv', () => {
  it('empieza con BOM UTF-8 para que Excel lea los acentos', () => {
    const csv = toCsv([], columns)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('Campaña')
  })

  it('escapa comas, comillas y saltos de línea', () => {
    const csv = toCsv(
      [{ marca: 'Vera, Moda', campana: 'Dijo "sí"', neto: 27000, notas: 'línea 1\nlínea 2' }],
      columns,
    )
    expect(csv).toContain('"Vera, Moda"')
    expect(csv).toContain('"Dijo ""sí"""')
    expect(csv).toContain('"línea 1\nlínea 2"')
  })

  it('deja la celda vacía cuando el valor es null', () => {
    const csv = toCsv([{ marca: 'Lumière', campana: 'Aurora', neto: 24000, notas: null }], columns)
    expect(csv.split('\r\n')[1]).toBe('Lumière,Aurora,24000,')
  })

  it('separa filas con CRLF', () => {
    const csv = toCsv(
      [
        { marca: 'A', campana: 'X', neto: 1, notas: null },
        { marca: 'B', campana: 'Y', neto: 2, notas: null },
      ],
      columns,
    )
    expect(csv.split('\r\n')).toHaveLength(3)
  })
})
