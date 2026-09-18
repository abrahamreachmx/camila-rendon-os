import { PDFViewer } from '@react-pdf/renderer'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download, FileDown, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/data/EmptyState'
import { MoneyCell } from '@/components/data/MoneyCell'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getSignedUrl } from '@/lib/api/invoices'
import { createQuote, deleteQuote, readQuoteItems } from '@/lib/api/quotes'
import { getSettings, readPresets } from '@/lib/api/settings'
import { formatDateLong } from '@/lib/dates'
import type { Currency } from '@/lib/money'
import { downloadOrShare, toPdfBlob } from '@/pdf/downloadPdf'
import { QuotePdf, type QuotePdfData } from '@/pdf/QuotePdf'
import type { CampaignWithRelations, Quote } from '@/types'

export function CampaignQuoteTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignWithRelations
  onSaved: () => void
}) {
  const [dialog, setDialog] = useState<
    { mode: 'closed' } | { mode: 'form' } | { mode: 'preview'; quote: Quote }
  >({ mode: 'closed' })
  const [termsKey, setTermsKey] = useState('')
  const [notes, setNotes] = useState('')
  const [deleting, setDeleting] = useState<Quote | null>(null)

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const presets = settings ? readPresets(settings) : []

  const { data: logoUrl = null } = useQuery({
    queryKey: ['brand-logo', settings?.brand_logo_path],
    queryFn: () => (settings?.brand_logo_path ? getSignedUrl(settings.brand_logo_path) : null),
    enabled: Boolean(settings?.brand_logo_path),
  })

  const create = useMutation({
    mutationFn: () => {
      const label = presets.find((preset) => preset.key === termsKey)?.label ?? ''
      return createQuote(campaign.id, { termsLabel: label, notes: notes || null })
    },
    onSuccess: (quote) => {
      setNotes('')
      onSaved()
      setDialog({ mode: 'preview', quote })
      toast.success(`Cotización ${quote.folio} creada.`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (quote: Quote) => deleteQuote(quote.id),
    onSuccess: () => { setDeleting(null); onSaved(); toast.success('Cotización eliminada.') },
    onError: (error: Error) => toast.error(error.message),
  })

  function buildData(quote: Quote): QuotePdfData | null {
    if (!settings) return null
    return {
      folio: quote.folio,
      issuedAt: quote.issued_at,
      validUntil: quote.valid_until,
      currency: quote.currency as Currency,
      items: readQuoteItems(quote),
      total: Number(quote.total),
      paymentTermsLabel: quote.payment_terms_label,
      notes: quote.notes,
      companyName: campaign.company?.name ?? '',
      contactName: campaign.contact?.name ?? null,
      contactEmail: campaign.contact?.email ?? null,
      campaignName: campaign.name,
      settings,
      logoUrl,
    }
  }

  async function download(quote: Quote) {
    const data = buildData(quote)
    if (!data) return
    try {
      const blob = await toPdfBlob(<QuotePdf data={data} />)
      await downloadOrShare(blob, `${quote.folio}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el PDF.')
    }
  }

  const previewQuote = dialog.mode === 'preview' ? dialog.quote : null
  const previewData = previewQuote ? buildData(previewQuote) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          Al cotizar se congelan los servicios: editar la campaña después no cambia una cotización ya emitida.
        </p>
        <Button onClick={() => setDialog({ mode: 'form' })} disabled={campaign.items.length === 0}>
          <FileDown className="size-4" /> Nueva cotización
        </Button>
      </div>

      {campaign.quotes.length === 0 ? (
        <EmptyState message="Aún no hay cotizaciones. Genera la primera desde los servicios de la campaña." />
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {campaign.quotes.map((quote) => (
            <li key={quote.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{quote.folio}</p>
                <p className="text-[13px] text-ink-muted">
                  {formatDateLong(quote.issued_at)}
                  {quote.valid_until ? ` · válida hasta ${formatDateLong(quote.valid_until)}` : ''}
                  {quote.payment_terms_label ? ` · ${quote.payment_terms_label}` : ''}
                </p>
              </div>
              <MoneyCell amount={quote.total} currency={quote.currency as Currency} strong />
              <Button variant="outline" size="sm" onClick={() => setDialog({ mode: 'preview', quote })}>
                Ver
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Descargar ${quote.folio}`}
                onClick={() => void download(quote)}>
                <Download className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Eliminar ${quote.folio}`}
                onClick={() => setDeleting(quote)}>
                <Trash2 className="size-4 text-overdue" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialog.mode !== 'closed'}
        onOpenChange={(next) => !next && setDialog({ mode: 'closed' })}
      >
        <DialogContent className={dialog.mode === 'preview' ? 'sm:max-w-[900px]' : undefined}>
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'preview' ? previewQuote?.folio : 'Nueva cotización'}
            </DialogTitle>
          </DialogHeader>

          {dialog.mode === 'form' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quote-terms">Condiciones de pago</Label>
                  <Select value={termsKey} onValueChange={setTermsKey}>
                    <SelectTrigger id="quote-terms"><SelectValue placeholder="Elige un plazo" /></SelectTrigger>
                    <SelectContent>
                      {presets.map((preset) => (
                        <SelectItem key={preset.key} value={preset.key}>{preset.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-notes">Notas</Label>
                  <Textarea id="quote-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog({ mode: 'closed' })}>Cancelar</Button>
                <Button onClick={() => create.mutate()} disabled={!termsKey || create.isPending}>
                  {create.isPending ? 'Generando…' : 'Generar'}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialog.mode === 'preview' && (
            <>
              {previewData && (
                <PDFViewer
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                  showToolbar={false}
                >
                  <QuotePdf data={previewData} />
                </PDFViewer>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog({ mode: 'closed' })}>Cerrar</Button>
                <Button onClick={() => previewQuote && void download(previewQuote)}>
                  <Download className="size-4" /> Descargar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {deleting?.folio}</AlertDialogTitle>
            <AlertDialogDescription>
              Se borra el registro de la cotización. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
