import type { Database } from '@/types/database'
import type { Currency } from '@/lib/money'
import type { IsoDate } from '@/lib/dates'

type Tables = Database['public']['Tables']
export type Row<T extends keyof Tables> = Tables[T]['Row']
export type Insert<T extends keyof Tables> = Tables[T]['Insert']
export type Update<T extends keyof Tables> = Tables[T]['Update']

export type Settings = Row<'settings'>
export type Company = Row<'companies'>
export type Contact = Row<'contacts'>
export type Service = Row<'services'>
export type CampaignStatus = Row<'campaign_statuses'>
export type Campaign = Row<'campaigns'>
export type CampaignItem = Row<'campaign_items'>
export type Payment = Row<'payment_schedules'>
export type Invoice = Row<'invoices'>
export type Quote = Row<'quotes'>
export type Gifting = Row<'gifting'>
export type SavedReport = Row<'reports'>

export type CompanyStage = 'prospecto' | 'negociando' | 'cliente'
export type PaymentStatus = 'pendiente' | 'en_proceso' | 'pagado'
export type GiftingStatus = 'propuesto' | 'enviado' | 'recibido' | 'publicado' | 'declinado'

/** Estatus efectivo de un cobro: "vencido" se calcula, no se guarda. */
export type EffectivePaymentStatus = PaymentStatus | 'vencido'

export type CampaignWithRelations = Campaign & {
  company: Pick<Company, 'id' | 'name' | 'stage'> | null
  contact: Pick<Contact, 'id' | 'name' | 'email' | 'phone'> | null
  status: CampaignStatus | null
  items: CampaignItem[]
  payments: Payment[]
  invoices: Invoice[]
  quotes: Quote[]
}

/** Lo mínimo de un cobro para resumir el estatus de cobro de una campaña. */
export type PaymentBrief = Pick<Payment, 'amount' | 'status' | 'due_date'>

export type CampaignListRow = Campaign & {
  company: Pick<Company, 'id' | 'name'> | null
  status: Pick<CampaignStatus, 'id' | 'name' | 'color' | 'is_closed'> | null
  /** Sólo lo trae listCampaigns; getHomeData usa su propio select sin cobros. */
  payments?: PaymentBrief[]
}

export type PaymentWithCampaign = Payment & {
  campaign: Pick<Campaign, 'id' | 'name' | 'currency' | 'fx_rate_mxn'> & {
    company: Pick<Company, 'id' | 'name'> | null
  }
}

export type CompanyWithRelations = Company & {
  contacts: Contact[]
  campaigns: CampaignListRow[]
  gifting: Gifting[]
}

export type CampaignItemInput = {
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
  paid_media: boolean
  collab: boolean
}

export type QuoteItemSnapshot = {
  description: string
  quantity: number
  unit_price: number
  line_total: number
  paid_media: boolean
  collab: boolean
}

/** Salida del RPC `report_summary`. Ver BLUEPRINT.md §4. */
export type ReportSummary = {
  period: { from: IsoDate; to: IsoDate }
  campaigns: {
    total: number
    closed: number
    by_status: { status: string | null; count: number }[]
    produced: number
    on_time: number
  }
  sales: {
    gross_mxn: number
    net_mxn: number
    avg_ticket_mxn: number
    by_currency: { currency: Currency; gross: number; net: number; count: number }[]
  }
  commissions: { generated_mxn: number; paid_mxn: number; pending_mxn: number }
  collections: {
    collected_mxn: number
    due_in_period_mxn: number
    pending_mxn: number
    overdue_mxn: number
  }
  top_companies: { company: string; net_mxn: number; count: number }[]
  top_services: { service: string; units: number; revenue_mxn: number }[]
  crm: {
    new_companies: number
    became_clients: number
    by_stage: { stage: CompanyStage; count: number }[]
  }
  gifting: { received: number; total_in_period: number }
  monthly_sales: { month: string; net_mxn: number }[]
}
