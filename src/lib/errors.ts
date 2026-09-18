/** Error de dominio. `message` siempre en español: se muestra tal cual en un toast. */
export type AppErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'AUTH'
  | 'STORAGE'
  | 'UNKNOWN'

export class AppError extends Error {
  readonly code: AppErrorCode

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AppError'
    this.code = code
  }
}

type SupabaseLikeError = {
  code?: string | null
  message?: string | null
  details?: string | null
  status?: number | null
}

/** Traduce un error de supabase-js a un AppError con mensaje legible en español. */
export function fromSupabaseError(error: unknown, fallback = 'No se pudo completar la operación.'): AppError {
  if (error instanceof AppError) return error

  const e = (error ?? {}) as SupabaseLikeError
  const code = e.code ?? ''
  const status = e.status ?? 0

  if (code === '23505') {
    return new AppError('CONFLICT', 'Ya existe un registro con ese nombre.', { cause: error })
  }
  if (code === '23503') {
    return new AppError('CONFLICT', 'No se puede borrar: hay registros que dependen de este.', { cause: error })
  }
  if (code === '23514') {
    return new AppError('VALIDATION', 'Alguno de los valores está fuera de rango.', { cause: error })
  }
  if (code === 'PGRST116') {
    return new AppError('NOT_FOUND', 'No se encontró el registro.', { cause: error })
  }
  if (status === 401 || status === 403 || code === '42501') {
    return new AppError('AUTH', 'Tu sesión expiró. Vuelve a entrar.', { cause: error })
  }

  const message = typeof e.message === 'string' && e.message.length > 0 ? e.message : fallback
  console.error('[AppError:UNKNOWN]', error)
  return new AppError('UNKNOWN', message, { cause: error })
}

/** Envuelve una respuesta `{ data, error }` de supabase-js. */
export function unwrap<T>(result: { data: T; error: unknown }, notFoundMessage?: string): NonNullable<T> {
  if (result.error) throw fromSupabaseError(result.error)
  if (result.data === null || result.data === undefined) {
    throw new AppError('NOT_FOUND', notFoundMessage ?? 'No se encontró el registro.')
  }
  return result.data as NonNullable<T>
}
