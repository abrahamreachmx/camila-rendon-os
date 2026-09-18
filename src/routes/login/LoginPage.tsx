import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/auth'
import { appUrl, supabase } from '@/lib/supabase'

type Mode = 'signIn' | 'forgot' | 'recovery'

/** Supabase devuelve `type=recovery` en el hash tras el correo de recuperación. */
function isRecoveryLink(): boolean {
  return window.location.hash.includes('type=recovery')
}

export default function LoginPage() {
  const { session, loading } = useSession()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>(() => (isRecoveryLink() ? 'recovery' : 'signIn'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/'

  if (!loading && session && mode !== 'recovery') {
    return <Navigate to={returnTo} replace />
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      toast.error('No pudimos entrar. Revisa el correo y la contraseña.')
      return
    }
  }

  async function handleForgot(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl.replace(/\/$/, '')}/login`,
    })
    setBusy(false)
    if (error) {
      toast.error('No se pudo enviar el correo de recuperación.')
      return
    }
    toast.success('Te enviamos un correo con el enlace para crear una contraseña nueva.')
    setMode('signIn')
  }

  async function handleRecovery(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      toast.error('No se pudo actualizar la contraseña. Pide un enlace nuevo.')
      return
    }
    toast.success('Contraseña actualizada.')
    window.location.hash = ''
    setMode('signIn')
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-[400px]">
        <h1 className="font-heading text-[32px] leading-[1.15]">Camila Rendón OS</h1>
        <p className="mt-2 text-ink-muted">
          {mode === 'signIn' && 'Entra para ver campañas, cobros y reportes.'}
          {mode === 'forgot' && 'Te mandamos un enlace para crear una contraseña nueva.'}
          {mode === 'recovery' && 'Escribe tu nueva contraseña.'}
        </p>

        <div className="mt-8 rounded-lg border border-line bg-surface p-6">
          {mode === 'recovery' ? (
            <form onSubmit={handleRecovery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Contraseña nueva</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar contraseña'}
              </Button>
            </form>
          ) : (
            <form onSubmit={mode === 'signIn' ? handleSignIn : handleForgot} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode === 'signIn' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Un momento…' : mode === 'signIn' ? 'Entrar' : 'Enviar enlace'}
              </Button>
            </form>
          )}

          {mode !== 'recovery' && (
            <button
              type="button"
              className="mt-4 text-[13px] text-ink-muted underline underline-offset-4 hover:text-plum"
              onClick={() => setMode(mode === 'signIn' ? 'forgot' : 'signIn')}
            >
              {mode === 'signIn' ? 'Olvidé mi contraseña' : 'Volver a entrar'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
