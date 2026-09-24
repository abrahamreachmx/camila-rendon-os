import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CampaignFieldsForm, type CampaignFields } from '@/components/forms/CampaignFields'
import { CampaignItemsEditor } from '@/components/forms/CampaignItemsEditor'
import { PaymentPlanGenerator } from '@/components/forms/PaymentPlanGenerator'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { createCampaign } from '@/lib/api/campaigns'
import { replacePlan } from '@/lib/api/payments'
import { listServices } from '@/lib/api/services'
import { campaignSchema } from '@/lib/schemas/campaign'
import { round2, sumBy } from '@/lib/money'
import { grossFor } from '@/lib/taxes'
import type { PlanRow } from '@/lib/paymentPlan'
import type { CampaignItemInput } from '@/types'

const EMPTY: CampaignFields = {
  company_id: '', contact_id: null, name: '', status_id: null,
  currency: 'MXN', fx_rate_mxn: 1,
  content_due_date: null, publish_date: null, close_month: null, signed_at: null,
  brief: null, notes: null,
}

export default function CampaignNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [fields, setFields] = useState<CampaignFields>(EMPTY)
  const [items, setItems] = useState<CampaignItemInput[]>([])
  const [plan, setPlan] = useState<PlanRow[]>([])

  const { data: services = [] } = useQuery({
    queryKey: ['services', { activeOnly: true }],
    queryFn: () => listServices({ activeOnly: true }),
  })

  const subtotal = sumBy(items, (item) => round2(item.quantity * item.unit_price))
  // En pesos se cobra el total de la factura (con IVA y retención), no el subtotal.
  const collectible = grossFor(subtotal, fields.currency)

  const create = useMutation({
    mutationFn: async () => {
      const parsed = campaignSchema.safeParse({ ...fields, contract_signed: false, items })
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Revisa los datos de la campaña.')
      }
      const campaign = await createCampaign({ ...parsed.data, items })
      if (plan.length > 0) await replacePlan(campaign.id, plan)
      return campaign
    },
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Campaña creada.')
      void navigate(`/campanas/${campaign.id}`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <>
      <Link to="/campanas" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-plum">
        <ArrowLeft className="size-4" aria-hidden /> Campañas
      </Link>

      <PageHeader title="Nueva campaña" description="Marca y datos, servicios, y plan de pagos." />

      <div className="space-y-8">
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="mb-4 font-heading text-[20px]">Marca y datos</h2>
          <CampaignFieldsForm value={fields} onChange={(patch) => setFields({ ...fields, ...patch })} />
        </section>

        <section>
          <h2 className="mb-4 font-heading text-[20px]">Servicios</h2>
          <CampaignItemsEditor items={items} services={services} currency={fields.currency} onChange={setItems} />
        </section>

        <section>
          <h2 className="mb-1 font-heading text-[20px]">Plan de pagos</h2>
          <p className="mb-4 text-[13px] text-ink-muted">
            {fields.currency === 'MXN'
              ? 'Se calcula sobre el total a facturar: neto + IVA 16 % − retención ISR 1.25 %.'
              : 'Se calcula sobre el total de los servicios.'}{' '}
            Si negocias un neto distinto, ajústalo después en la campaña.
          </p>
          <PaymentPlanGenerator
            rows={plan}
            onChange={setPlan}
            total={collectible}
            currency={fields.currency}
            baseDate={fields.signed_at}
          />
        </section>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? 'Creando…' : 'Crear campaña'}
          </Button>
          <Button variant="outline" onClick={() => void navigate('/campanas')}>Cancelar</Button>
        </div>
      </div>
    </>
  )
}
