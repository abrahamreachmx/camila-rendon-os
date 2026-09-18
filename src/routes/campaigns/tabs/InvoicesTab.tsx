import { useMutation } from '@tanstack/react-query'
import { Download, ExternalLink, FileText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/data/EmptyState'
import { InvoiceUploader } from '@/components/forms/InvoiceUploader'
import { Button } from '@/components/ui/button'
import { deleteInvoice, getSignedUrl, uploadInvoice } from '@/lib/api/invoices'
import { formatDateLong } from '@/lib/dates'
import type { CampaignWithRelations, Invoice } from '@/types'

export function CampaignInvoicesTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignWithRelations
  onSaved: () => void
}) {
  const upload = useMutation({
    mutationFn: (file: File) => uploadInvoice(campaign.id, file),
    onSuccess: () => { onSaved(); toast.success('Factura subida.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (invoice: Invoice) => deleteInvoice(invoice),
    onSuccess: () => { onSaved(); toast.success('Factura eliminada.') },
    onError: (error: Error) => toast.error(error.message),
  })

  async function open(invoice: Invoice, download: boolean) {
    try {
      const url = await getSignedUrl(invoice.storage_path)
      if (download) {
        const link = document.createElement('a')
        link.href = url
        link.download = invoice.filename
        link.click()
      } else {
        window.open(url, '_blank', 'noopener')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo abrir el archivo.')
    }
  }

  return (
    <div className="space-y-6">
      <InvoiceUploader onFile={(file) => upload.mutate(file)} busy={upload.isPending} />

      {campaign.invoices.length === 0 ? (
        <EmptyState message="Todavía no hay facturas de esta campaña." />
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {campaign.invoices.map((invoice) => (
            <li key={invoice.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <FileText className="size-4 shrink-0 text-ink-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{invoice.filename}</p>
                <p className="text-[13px] text-ink-muted">
                  {invoice.kind.toUpperCase()}
                  {invoice.size_bytes ? ` · ${Math.round(invoice.size_bytes / 1024)} KB` : ''}
                  {` · ${formatDateLong(invoice.created_at.slice(0, 10))}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Abrir ${invoice.filename}`}
                onClick={() => void open(invoice, false)}>
                <ExternalLink className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Descargar ${invoice.filename}`}
                onClick={() => void open(invoice, true)}>
                <Download className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Eliminar ${invoice.filename}`}
                onClick={() => remove.mutate(invoice)}>
                <Trash2 className="size-4 text-overdue" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
