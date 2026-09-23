import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deleteCampaign, getCampaign, updateCampaign } from '@/lib/api/campaigns'
import { listStatuses } from '@/lib/api/statuses'
import { calcCommission } from '@/lib/commission'
import { formatMoney, type Currency } from '@/lib/money'
import { CampaignInvoicesTab } from '@/routes/campaigns/tabs/InvoicesTab'
import { CampaignPaymentsTab } from '@/routes/campaigns/tabs/PaymentsTab'
import { CampaignDeliverablesTab } from '@/routes/campaigns/tabs/DeliverablesTab'
import { CampaignQuoteTab } from '@/routes/campaigns/tabs/QuoteTab'
import { CampaignSummaryTab } from '@/routes/campaigns/tabs/SummaryTab'

export default function CampaignDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: campaign, isPending } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => getCampaign(id),
  })
  const { data: statuses = [] } = useQuery({ queryKey: ['statuses'], queryFn: listStatuses })

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    void queryClient.invalidateQueries({ queryKey: ['payments'] })
    void queryClient.invalidateQueries({ queryKey: ['home'] })
    void queryClient.invalidateQueries({ queryKey: ['deliverables'] })
  }

  const changeStatus = useMutation({
    mutationFn: (statusId: string) => updateCampaign(id, { status_id: statusId }),
    onSuccess: () => { refresh(); toast.success('Estatus actualizado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: () => deleteCampaign(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
    void queryClient.invalidateQueries({ queryKey: ['home'] })
    void queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      toast.success('Campaña eliminada.')
      void navigate('/campanas')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isPending) return <LoadingRows rows={6} />
  if (!campaign) return <EmptyState message="No encontramos esa campaña." />

  const currency = campaign.currency as Currency
  const commission = calcCommission(Number(campaign.net_amount), Number(campaign.commission_pct))

  return (
    <>
      <Link to="/campanas" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-plum">
        <ArrowLeft className="size-4" aria-hidden /> Campañas
      </Link>

      <PageHeader
        title={campaign.name}
        description={
          campaign.company ? (
            <Link to={`/marcas/${campaign.company.id}`} className="underline underline-offset-4 hover:text-plum">
              {campaign.company.name}
            </Link>
          ) : null
        }
        actions={
          <>
            <Select value={campaign.status_id ?? ''} onValueChange={(value) => changeStatus.mutate(value)}>
              <SelectTrigger className="w-[190px]" aria-label="Cambiar estatus"><SelectValue placeholder="Sin estatus" /></SelectTrigger>
              <SelectContent>
                {statuses.map((status) => <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4 text-overdue" /> Eliminar
            </Button>
          </>
        }
      />

      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        <Total label="Bruto" value={formatMoney(Number(campaign.gross_amount), currency)} />
        <Total label="Neto" value={formatMoney(Number(campaign.net_amount), currency)} strong />
        <Total label={`Comisión (${Number(campaign.commission_pct)} %)`} value={formatMoney(commission, currency)} />
        <Total
          label="Moneda"
          value={currency === 'MXN' ? 'MXN' : `${currency} · ${Number(campaign.fx_rate_mxn)} MXN`}
        />
      </dl>

      <Tabs defaultValue="resumen">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="cotizacion">Cotización</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen"><CampaignSummaryTab campaign={campaign} onSaved={refresh} /></TabsContent>
        <TabsContent value="cotizacion"><CampaignQuoteTab campaign={campaign} onSaved={refresh} /></TabsContent>
        <TabsContent value="entregas"><CampaignDeliverablesTab campaign={campaign} onSaved={refresh} /></TabsContent>
        <TabsContent value="pagos"><CampaignPaymentsTab campaign={campaign} onSaved={refresh} /></TabsContent>
        <TabsContent value="facturas"><CampaignInvoicesTab campaign={campaign} onSaved={refresh} /></TabsContent>
      </Tabs>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar “{campaign.name}”</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran también sus servicios, cobros, facturas y cotizaciones. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-heading text-[20px]' : 'text-[17px]'}`}>{value}</dd>
    </div>
  )
}
