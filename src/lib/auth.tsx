import type { Session } from '@supabase/supabase-js'
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { supabase } from '@/lib/supabase'

type AuthState = {
  session: Session | null
  loading: boolean
  email: string | null
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({ session, loading, email: session?.user.email ?? null }),
    [session, loading],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useSession(): AuthState {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de <AuthProvider>')
  return ctx
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/** Protege las rutas privadas y recuerda a dónde quería ir la usuaria. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-ink-muted">
        <span className="sr-only">Cargando</span>
        <div className="size-6 animate-spin rounded-full border-2 border-line border-t-plum" aria-hidden />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />
  }

  return <>{children}</>
}
