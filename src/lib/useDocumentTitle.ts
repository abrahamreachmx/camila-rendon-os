import { useEffect } from 'react'

const BASE = 'Camila Rendón OS'

/** Título del documento por página; se restaura al salir. */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE
    return () => {
      document.title = BASE
    }
  }, [title])
}
