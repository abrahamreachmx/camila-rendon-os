import { describe, expect, it } from 'vitest'
import {
  addBusinessDaysIso,
  isBusinessDay,
  mexicanHolidays,
  nextBusinessDay,
} from '@/lib/holidays'

describe('mexicanHolidays', () => {
  it('incluye los cuatro de fecha fija', () => {
    const f = mexicanHolidays(2026)
    expect(f).toContain('2026-01-01')
    expect(f).toContain('2026-05-01')
    expect(f).toContain('2026-09-16')
    expect(f).toContain('2026-12-25')
  })

  it('mueve a lunes los tres que la ley recorre', () => {
    // 2026: 2 de febrero, 16 de marzo y 16 de noviembre son lunes.
    const f = mexicanHolidays(2026)
    expect(f).toContain('2026-02-02')
    expect(f).toContain('2026-03-16')
    expect(f).toContain('2026-11-16')
    // Las fechas conmemoradas NO son el asueto.
    expect(f).not.toContain('2026-02-05')
    expect(f).not.toContain('2026-03-21')
    expect(f).not.toContain('2026-11-20')
  })

  it('el primer lunes de febrero de 2027 es el día 1', () => {
    expect(mexicanHolidays(2027)).toContain('2027-02-01')
  })

  it('cuando el día 1 ya es lunes, ese es el primero', () => {
    // 1 de febrero de 2027 cae lunes; el primer lunes es el 1, no el 8.
    expect(mexicanHolidays(2027)).not.toContain('2027-02-08')
  })

  it('el 1 de diciembre sólo en años de relevo presidencial', () => {
    expect(mexicanHolidays(2024)).toContain('2024-12-01')
    expect(mexicanHolidays(2030)).toContain('2030-12-01')
    expect(mexicanHolidays(2026)).not.toContain('2026-12-01')
    expect(mexicanHolidays(2029)).not.toContain('2029-12-01')
  })

  it('devuelve siete días en un año normal y ocho en uno de relevo', () => {
    expect(mexicanHolidays(2026)).toHaveLength(7)
    expect(mexicanHolidays(2030)).toHaveLength(8)
  })
})

describe('isBusinessDay', () => {
  it('rechaza sábados y domingos', () => {
    expect(isBusinessDay('2026-09-19')).toBe(false) // sábado
    expect(isBusinessDay('2026-09-20')).toBe(false) // domingo
  })

  it('acepta un día entre semana cualquiera', () => {
    expect(isBusinessDay('2026-09-18')).toBe(true) // viernes
  })

  it('rechaza un feriado que cae entre semana', () => {
    expect(isBusinessDay('2026-09-16')).toBe(false) // miércoles, Independencia
    expect(isBusinessDay('2026-11-16')).toBe(false) // lunes de asueto
  })
})

describe('nextBusinessDay', () => {
  it('deja intacto un día hábil', () => {
    expect(nextBusinessDay('2026-09-18')).toBe('2026-09-18')
  })

  it('recorre el sábado al lunes', () => {
    expect(nextBusinessDay('2026-09-19')).toBe('2026-09-21')
  })

  it('salta el puente completo', () => {
    // Sábado 14 de noviembre de 2026; el lunes 16 es asueto.
    expect(nextBusinessDay('2026-11-14')).toBe('2026-11-17')
  })
})

describe('addBusinessDaysIso', () => {
  it('con cero días se comporta como nextBusinessDay', () => {
    expect(addBusinessDaysIso('2026-09-18', 0)).toBe('2026-09-18')
    expect(addBusinessDaysIso('2026-09-19', 0)).toBe('2026-09-21')
  })

  it('un día hábil desde viernes cae lunes', () => {
    expect(addBusinessDaysIso('2026-09-18', 1)).toBe('2026-09-21')
  })

  it('treinta días hábiles desde un viernes caen seis semanas después', () => {
    // 30 hábiles sin feriados de por medio = 42 días naturales.
    expect(addBusinessDaysIso('2026-09-18', 30)).toBe('2026-10-30')
  })

  it('salta el asueto de noviembre', () => {
    // Del viernes 13 de noviembre, 1 hábil sería el lunes 16, pero es asueto.
    expect(addBusinessDaysIso('2026-11-13', 1)).toBe('2026-11-17')
  })

  it('cruza el fin de año saltando navidad y año nuevo', () => {
    // Del jueves 24 de diciembre de 2026: el 25 es feriado, el 1 de enero también.
    expect(addBusinessDaysIso('2026-12-24', 5)).toBe('2027-01-04')
  })

  it('nunca devuelve un día inhábil', () => {
    const bases = ['2026-01-01', '2026-09-19', '2026-11-14', '2026-12-24']
    for (const base of bases) {
      for (let n = 0; n <= 40; n += 1) {
        expect(isBusinessDay(addBusinessDaysIso(base, n))).toBe(true)
      }
    }
  })
})
