/**
 * Descarga un blob. Vive aparte de `pdf/downloadPdf` a propósito: el export CSV
 * también la usa y no debe arrastrar consigo el bundle de react-pdf.
 *
 * El enlace tiene que estar en el DOM y la URL sobrevivir al arranque de la
 * descarga: revocarla en la misma línea hace que el navegador pierda el nombre
 * y guarde el archivo como un UUID.
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
