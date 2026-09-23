import { describe, expect, it } from 'vitest'
import { isBusinessDay } from '@/lib/holidays'
import { sumBy } from '@/lib/money'
import {
  generatePaymentPlan,
  mergePlanKeepingPaid,
  remainingToCollect,
  type PaymentPreset,
} from '@/lib/paymentPlan'

const contado: PaymentPreset = { key: 'contado', label: 'Contado', parts: [{ pct: 100, days: 0 }] }
const a30: PaymentPreset = { key: '30', label: '30 días', parts: [{ pct: 100, days: 30 }] }
const a60: PaymentPreset = { key: '60', label: '60 días', parts: [{ pct: 100, days: 60 }] }
const a90: PaymentPreset = { key: '90', label: '90 días', parts: [{ pct: 100, days: 90 }] }
const mitades: PaymentPreset = {
  key: '50-50',
  label: '50/50',
  parts: [
    { pct: 50, days: 0 },
    { pct: 50, days: 30 },
  ],
}
const tercios: PaymentPreset = {
  key: 'tercios',
  label: 'Tres partes iguales',
  parts: [
    { pct: 100 / 3, days: 0 },
    { pct: 100 / 3, days: 30 },
    { pct: 100 / 3, days: 60 },
  ],
}

describe('generatePaymentPlan · presets de una sola exhibición', () => {
  it('contado cobra todo en la fecha base', () => {
    expect(generatePaymentPlan(contado, '2026-10-01', 24000)).toEqual([
      { due_date: '2026-10-01', amount: 24000, sort_order: 1 },
    ])
  })

  it('30, 60 y 90 días suman los días correctos', () => {
    expect(generatePaymentPlan(a30, '2026-10-01', 1000)[0].due_date).toBe('2026-10-31')
    expect(generatePaymentPlan(a60, '2026-10-01', 1000)[0].due_date).toBe('2026-11-30')
    expect(generatePaymentPlan(a90, '2026-10-01', 1000)[0].due_date).toBe('2026-12-30')
  })

  it('cruza el fin de año sin perderse', () => {
    expect(generatePaymentPlan(a90, '2026-11-15', 1000)[0].due_date).toBe('2027-02-13')
  })

  it('cuenta bien un año bisiesto', () => {
    // 2028 es bisiesto: 1-feb + 30 días = 2-marzo
    expect(generatePaymentPlan(a30, '2028-02-01', 1000)[0].due_date).toBe('2028-03-02')
  })
})

describe('generatePaymentPlan · el caso del blueprint', () => {
  it('50/50 sobre 2 000 con base 1-oct da 1 000 el 1-oct y 1 000 el 31-oct', () => {
    expect(generatePaymentPlan(mitades, '2026-10-01', 2000)).toEqual([
      { due_date: '2026-10-01', amount: 1000, sort_order: 1 },
      { due_date: '2026-10-31', amount: 1000, sort_order: 2 },
    ])
  })

  it('50/50 sobre 1 001 da 500.50 y 500.50', () => {
    const rows = generatePaymentPlan(mitades, '2026-10-01', 1001)
    expect(rows.map((r) => r.amount)).toEqual([500.5, 500.5])
  })

  it('tres partes iguales sobre 1 000 dan 333.33 / 333.33 / 333.34', () => {
    const rows = generatePaymentPlan(tercios, '2026-10-01', 1000)
    expect(rows.map((r) => r.amount)).toEqual([333.33, 333.33, 333.34])
  })
})

describe('generatePaymentPlan · la suma siempre cuadra', () => {
  const totales = [0, 0.01, 1, 999.99, 1000, 1001, 2000, 4_000_000, 33_333.33]
  const presets = [contado, a30, mitades, tercios]

  for (const preset of presets) {
    for (const total of totales) {
      it(`${preset.key} sobre ${total} suma exactamente el total`, () => {
        const rows = generatePaymentPlan(preset, '2026-09-18', total)
        const suma = rows.reduce((acc, row) => Math.round((acc + row.amount) * 100) / 100, 0)
        expect(suma).toBe(Math.round(total * 100) / 100)
      })
    }
  }
})

describe('generatePaymentPlan · validación', () => {
  it('rechaza un preset cuyos porcentajes no suman 100', () => {
    const malo: PaymentPreset = {
      key: 'malo',
      label: 'Mal armado',
      parts: [
        { pct: 40, days: 0 },
        { pct: 40, days: 30 },
      ],
    }
    expect(() => generatePaymentPlan(malo, '2026-10-01', 1000)).toThrow(/80 % y deben sumar 100/)
  })

  it('rechaza un preset sin partes', () => {
    expect(() => generatePaymentPlan({ key: 'x', label: 'x', parts: [] }, '2026-10-01', 100)).toThrow(
      /no tiene partes/,
    )
  })
})

describe('mergePlanKeepingPaid', () => {
  it('conserva las filas pagadas y reacomoda el orden de las nuevas', () => {
    const existing = [
      { id: 'a', due_date: '2026-09-01', amount: 1000, status: 'pagado' },
      { id: 'b', due_date: '2026-10-01', amount: 1000, status: 'pendiente' },
    ]
    const generated = generatePaymentPlan(mitades, '2026-11-01', 1500)
    const { kept, incoming } = mergePlanKeepingPaid(existing, generated)

    expect(kept.map((r) => r.id)).toEqual(['a'])
    expect(incoming.map((r) => r.sort_order)).toEqual([2, 3])
    expect(incoming.map((r) => r.amount)).toEqual([750, 750])
  })
})

describe('remainingToCollect', () => {
  it('descuenta lo ya pagado', () => {
    expect(
      remainingToCollect(27000, [
        { amount: 13500, status: 'pagado' },
        { amount: 13500, status: 'pendiente' },
      ]),
    ).toBe(13500)
  })

  it('sin pagos devuelve el total', () => {
    expect(remainingToCollect(24000, [])).toBe(24000)
  })
})

describe('generatePaymentPlan en días hábiles', () => {
  const a30: PaymentPreset = { key: 'a30', label: '30 días', parts: [{ pct: 100, days: 30 }] }
  const habiles = { businessDays: true }

  it('treinta días hábiles desde un viernes caen seis semanas después', () => {
    // 2026-09-18 es viernes; sin feriados de por medio son 42 días naturales.
    expect(generatePaymentPlan(a30, '2026-09-18', 1000, habiles)[0].due_date).toBe('2026-10-30')
  })

  it('salta el lunes de asueto de noviembre', () => {
    const uno: PaymentPreset = { key: 'a1', label: '1 día', parts: [{ pct: 100, days: 1 }] }
    // Del viernes 13 el siguiente hábil sería el lunes 16, pero es día de asueto.
    expect(generatePaymentPlan(uno, '2026-11-13', 500, habiles)[0].due_date).toBe('2026-11-17')
  })

  it('un plazo de contado sobre un sábado se recorre al lunes', () => {
    expect(generatePaymentPlan(contado, '2026-09-19', 500, habiles)[0].due_date).toBe('2026-09-21')
  })

  it('ninguna fecha generada cae en sábado, domingo ni feriado', () => {
    for (const preset of [contado, a30, a60, a90, mitades, tercios]) {
      for (const base of ['2026-09-18', '2026-11-13', '2026-12-24', '2027-01-01']) {
        for (const row of generatePaymentPlan(preset, base, 9000, habiles)) {
          expect(isBusinessDay(row.due_date), `${preset.key} desde ${base}: ${row.due_date}`).toBe(true)
        }
      }
    }
  })

  it('el reparto del dinero no cambia al contar en hábiles', () => {
    const naturales = generatePaymentPlan(tercios, '2026-09-18', 1000)
    const conHabiles = generatePaymentPlan(tercios, '2026-09-18', 1000, habiles)
    expect(conHabiles.map((r) => r.amount)).toEqual(naturales.map((r) => r.amount))
    expect(sumBy(conHabiles, (r) => r.amount)).toBe(1000)
  })

  it('sin la opción sigue contando días naturales', () => {
    expect(generatePaymentPlan(a30, '2026-09-18', 1000)[0].due_date).toBe('2026-10-18')
  })
})
