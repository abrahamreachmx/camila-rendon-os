import { pdf } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { triggerDownload } from '@/lib/download'

/** Genera el blob en el navegador. Ningún dato sale hacia terceros. */
export async function toPdfBlob(document: ReactElement): Promise<Blob> {
  return pdf(document as never).toBlob()
}

/**
 * En móvil abre la hoja de compartir si el navegador la ofrece; en escritorio
 * descarga. Si compartir falla o se cancela, cae a la descarga.
 */
export async function downloadOrShare(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  triggerDownload(blob, filename)
}
