import { LogOut } from 'lucide-react'
import { Outlet } from 'react-router'
import { MobileNav, Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth'

export function AppShell() {
  const { email } = useSession()

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-3 sm:px-6">
          <p className="truncate text-[13px] text-ink-muted">{email}</p>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </Button>
        </div>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 pb-24 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
