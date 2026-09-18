import {
  CalendarClock,
  Gift,
  Home,
  Megaphone,
  PieChart,
  Settings,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: LucideIcon; short: string }

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home, short: 'Inicio' },
  { to: '/campanas', label: 'Campañas', icon: Megaphone, short: 'Campañas' },
  { to: '/cobros', label: 'Cobros', icon: CalendarClock, short: 'Cobros' },
  { to: '/marcas', label: 'Marcas', icon: Store, short: 'Marcas' },
  { to: '/gifting', label: 'Gifting', icon: Gift, short: 'Gifting' },
  { to: '/reportes', label: 'Reportes', icon: PieChart, short: 'Reportes' },
  { to: '/configuracion', label: 'Configuración', icon: Settings, short: 'Ajustes' },
]

export function Sidebar() {
  return (
    <aside className="hidden w-[232px] shrink-0 border-r border-line bg-surface lg:block">
      <div className="sticky top-0 flex h-dvh flex-col px-4 py-6">
        <div className="px-2">
          <p className="font-heading text-[19px] leading-tight">Camila Rendón</p>
          <p className="text-[13px] text-ink-muted">Sistema de operación</p>
        </div>

        <nav className="mt-8 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[15px] transition-colors',
                  isActive ? 'bg-surface-2 font-semibold text-plum' : 'text-ink hover:bg-surface-2',
                )
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

/** En móvil la navegación baja a una barra inferior con los 5 destinos principales. */
export function MobileNav() {
  const items = NAV_ITEMS.slice(0, 4).concat(NAV_ITEMS[5])

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface lg:hidden">
      {items.map(({ to, short, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]',
              isActive ? 'text-plum' : 'text-ink-muted',
            )
          }
        >
          <Icon className="size-5" aria-hidden />
          {short}
        </NavLink>
      ))}
    </nav>
  )
}
