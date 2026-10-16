import { describe, expect, it } from 'vitest'
import { signInErrorMessage } from '@/lib/errors'

describe('signInErrorMessage', () => {
  it('sin respuesta del servidor no culpa a la contraseña', () => {
    const msg = signInErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })
    expect(msg).toMatch(/conectar con el servidor/)
  })

  it('un 5xx también es problema del servidor', () => {
    expect(signInErrorMessage({ name: 'AuthApiError', status: 503 })).toMatch(/conectar con el servidor/)
  })

  it('credenciales inválidas piden revisar correo y contraseña', () => {
    const msg = signInErrorMessage({ name: 'AuthApiError', status: 400, code: 'invalid_credentials' })
    expect(msg).toBe('No pudimos entrar. Revisa el correo y la contraseña.')
  })

  it('correo sin confirmar se dice tal cual', () => {
    const msg = signInErrorMessage({ name: 'AuthApiError', status: 400, code: 'email_not_confirmed' })
    expect(msg).toMatch(/no está confirmado/)
  })
})
