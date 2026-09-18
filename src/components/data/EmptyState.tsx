import type { ReactNode } from 'react'

/** Un estado vacío siempre dice qué hacer, no sólo que no hay nada. */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <p className="text-ink-muted">{message}</p>
      {action}
    </div>
  )
}
