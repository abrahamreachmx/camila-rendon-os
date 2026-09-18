import { pdf } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

/** Genera el blob en el navegador. Ningún dato sale hacia terceros. */
export async function toPdfBlob(document: ReactElement): Promise<Blob> {
  // La firma de `pdf()` espera un DocumentProps; el documento se construye aquí mismo.
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

/**
 * El enlace tiene que estar en el DOM y la URL sobrevivir al arranque de la
 * descarga: revocarla en la misma línea hace que el navegador pierda el
 * nombre y guarde el archivo como un UUID.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
