import { readableTextColor } from '@/lib/contrast'
import { cn } from '@/lib/utils'

/** Punto sólido + fondo del color al 12 %, según el §7 del blueprint. */
export function StatusBadge({
  label,
  color,
  className,
}: {
  label: string
  color: string
  className?: string
}) {
  // El fondo y el punto conservan el color elegido; sólo el texto se oscurece
  // lo necesario para ser legible sobre ese mismo tinte.
  const textColor = readableTextColor(color)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] whitespace-nowrap',
        className,
      )}
      style={{ backgroundColor: `${color}1F`, color: textColor }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  )
}

export const PAYMENT_STATUS_STYLE = {
  pendiente: { label: 'Pendiente', color: '#C08A2E' },
  en_proceso: { label: 'En proceso', color: '#3F5F8A' },
  pagado: { label: 'Pagado', color: '#3E7C5A' },
  vencido: { label: 'Vencido', color: '#B4433B' },
} as const

/**
 * Estatus de cobro agregado de una campaña. Reusa la paleta de cobros del §7.
 * Va aparte de PAYMENT_STATUS_STYLE porque ese mapa lo indexan cuatro pantallas
 * por el estatus de un cobro individual, que nunca es "parcial" ni "sin plan".
 */
export const COLLECTION_STATUS_STYLE = {
  sin_plan: { label: 'Sin plan', color: '#8B8079' },
  pendiente: PAYMENT_STATUS_STYLE.pendiente,
  en_proceso: PAYMENT_STATUS_STYLE.en_proceso,
  parcial: { label: 'Parcial', color: '#C08A2E' },
  pagado: PAYMENT_STATUS_STYLE.pagado,
  vencido: PAYMENT_STATUS_STYLE.vencido,
} as const

export const GIFTING_STATUS_STYLE = {
  propuesto: { label: 'Propuesto', color: '#8B8079' },
  enviado: { label: 'Enviado', color: '#3F5F8A' },
  recibido: { label: 'Recibido', color: '#C08A2E' },
  publicado: { label: 'Publicado', color: '#3E7C5A' },
  declinado: { label: 'Declinado', color: '#B4433B' },
} as const

export const COMPANY_STAGE_STYLE = {
  prospecto: { label: 'Prospecto', color: '#8B8079' },
  negociando: { label: 'Negociando', color: '#C08A2E' },
  cliente: { label: 'Cliente', color: '#3E7C5A' },
} as const
