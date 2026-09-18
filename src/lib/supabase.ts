import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

/** Los placeholders de .env.example no son configuración válida. */
function looksConfigured(value: string, placeholderFragment: string): boolean {
  return value.length > 0 && !value.includes(placeholderFragment)
}

export const isSupabaseConfigured =
  looksConfigured(url, 'TU-PROYECTO') && looksConfigured(publishableKey, 'reemplazame')

/**
 * Si faltan las llaves la app no revienta: monta un cliente apuntando a un host
 * inexistente y `ConfigScreen` explica qué configurar. Así el build siempre compila.
 */
export const supabase = createClient<Database>(
  isSupabaseConfigured ? url : 'https://sin-configurar.supabase.co',
  isSupabaseConfigured ? publishableKey : 'sin-configurar',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

/** URL pública del sitio; se usa en el correo de recuperación de contraseña. */
export const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
