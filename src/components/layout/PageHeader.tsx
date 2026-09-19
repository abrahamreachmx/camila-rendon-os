import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

/** Extrae texto plano de un título que puede venir como JSX. */
function toPlainText(node: ReactNode): string | null {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  return null
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  useDocumentTitle(toPlainText(title))

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-[26px] leading-[1.15] sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
