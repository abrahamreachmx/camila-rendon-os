import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Acepta arrastrar o elegir. La validación real (tipo y tamaño) vive en la API. */
export function InvoiceUploader({
  onFile,
  busy,
}: {
  onFile: (file: File) => void
  busy: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); handleFiles(event.dataTransfer.files) }}
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center transition-colors',
        dragging ? 'border-plum bg-surface-2' : 'border-line',
      )}
    >
      <Upload className="size-5 text-ink-muted" aria-hidden />
      <p className="text-ink-muted">Arrastra la factura aquí, o elígela desde tu equipo.</p>
      <p className="text-[13px] text-ink-muted">Sólo PDF y XML, hasta 10 MB.</p>
      <input
        ref={input}
        type="file"
        accept=".pdf,.xml,application/pdf,application/xml,text/xml"
        className="hidden"
        onChange={(event) => { handleFiles(event.target.files); event.target.value = '' }}
      />
      <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? 'Subiendo…' : 'Elegir archivo'}
      </Button>
    </div>
  )
}
