import { paymentCommission } from '@/lib/commission'
import { isOverdue, todayIso, type IsoDate } from '@/lib/dates'
import { round2, sumBy, toMxn, type Currency } from '@/lib/money'
import type { PaymentBrief, PaymentWithCampaign } from '@/types'

/** Estatus de cobro de una campaña completa: agrega los de su plan de pagos. */
export type CollectionStatus =
  | 'sin_plan'
  | 'pendiente'
  | 'en_proceso'
  | 'parcial'
  | 'pagado'
  | 'vencido'

export type CampaignCollection = {
  status: CollectionStatus
  /** Entero 0-100. Nunca 100 si falta algo por cobrar, nunca 0 si ya entró algo. */
  paidPct: number
  /** En la moneda de la campaña; consolidar a pesos no le toca a esta función. */
  total: number
  paid: number
  /** Hay algo vencido, aunque el estatus sea 'parcial'. */
  hasOverdue: boolean
  count: number
  paidCount: number
}

/**
 * Resume el plan de pagos de una campaña en un solo estatus.
 *
 * El cálculo vive en el cliente, no en SQL, porque "vencido" depende de hoy y
 * todo el sistema resuelve hoy con todayIso() en la zona del navegador. Postgres
 * usaría current_date en UTC y por la noche marcaría vencido un cobro que el
 * resto de la app muestra como pendiente.
 */
export function campaignPaymentStatus(
  payments: readonly PaymentBrief[],
  today: IsoDate = todayIso(),
): CampaignCollection {
  if (payments.length === 0) {
    return {
      status: 'sin_plan',
      paidPct: 0,
      total: 0,
      paid: 0,
      hasOverdue: false,
      count: 0,
      paidCount: 0,
    }
  }

  const count = payments.length
  const paidRows = payments.filter((payment) => payment.status === 'pagado')
  const paidCount = paidRows.length
  const total = sumBy(payments, (payment) => Number(payment.amount))
  const paid = sumBy(paidRows, (payment) => Number(payment.amount))
  const hasOverdue = payments.some((payment) => isOverdue(payment.due_date, payment.status, today))

  // Con montos en cero (intercambios, planes a medio capturar) el avance se mide
  // por número de cobros; así nunca se divide entre cero.
  const raw = total > 0 ? (paid / total) * 100 : (paidCount / count) * 100

  let paidPct = Math.round(raw)
  // Un pago chico sobre un total grande no puede decir 0 %, ni casi todo decir 100 %.
  if (raw > 0 && paidPct === 0) paidPct = 1
  if (raw < 100 && paidPct === 100) paidPct = 99

  const allPaid = paidCount === count
  let status: CollectionStatus
  if (allPaid) {
    status = 'pagado'
    paidPct = 100
  } else if (paidCount > 0) {
    status = 'parcial'
  } else if (hasOverdue) {
    status = 'vencido'
  } else if (payments.every((payment) => payment.status === 'en_proceso')) {
    status = 'en_proceso'
  } else {
    status = 'pendiente'
  }

  return {
    status,
    paidPct,
    total: round2(total),
    paid: round2(paid),
    hasOverdue,
    count,
    paidCount,
  }
}

const COLLECTION_RANK: Record<CollectionStatus, number> = {
  vencido: 0,
  parcial: 1,
  pendiente: 2,
  en_proceso: 3,
  pagado: 4,
  sin_plan: 5,
}

/**
 * Ordena por urgencia: lo vencido arriba y, dentro del mismo grupo, lo menos
 * cobrado primero. Una campaña parcial con algo vencido sube al grupo de vencidos.
 */
export function collectionSortValue(collection: CampaignCollection): number {
  const rank = collection.hasOverdue ? 0 : COLLECTION_RANK[collection.status]
  return rank * 1000 + collection.paidPct
}

export type IncomeTotals = { expected: number; paid: number; pending: number }

export type MonthIncomeSummary = {
  /** Por moneda, en su propia moneda, sólo las que aparecen en el mes. */
  byCurrency: ({ currency: Currency } & IncomeTotals)[]
  /** Todo consolidado a pesos con el tipo de cambio de cada campaña. */
  mxn: IncomeTotals
  overdueCount: number
  /** Comisión de la manager sobre lo que entra en el mes, en pesos. */
  commissionMxn: number
  /** La parte de esa comisión cuyas campañas aún no la tienen pagada. */
  commissionPendingMxn: number
}

const CURRENCY_ORDER: Currency[] = ['MXN', 'USD', 'EUR', 'COP']

/**
 * Totales de lo que entra en un mes: lo esperado, lo ya cobrado y lo que falta,
 * más la comisión que corresponde a ese dinero. Recibe los cobros de
 * listMonthPayments: lo pagado en el mes y lo pendiente con fecha hasta su fin.
 */
export function summarizeMonthIncome(
  payments: readonly PaymentWithCampaign[],
  today: IsoDate = todayIso(),
): MonthIncomeSummary {
  const empty = (): IncomeTotals => ({ expected: 0, paid: 0, pending: 0 })
  const byCurrency = new Map<Currency, IncomeTotals>()
  const mxn = empty()
  let overdueCount = 0
  let commissionMxn = 0
  let commissionPendingMxn = 0

  for (const payment of payments) {
    const currency = payment.campaign.currency as Currency
    const amount = Number(payment.amount)
    const amountMxn = toMxn(amount, Number(payment.campaign.fx_rate_mxn))
    const paid = payment.status === 'pagado'
    const bucket = byCurrency.get(currency) ?? empty()

    bucket.expected = round2(bucket.expected + amount)
    mxn.expected = round2(mxn.expected + amountMxn)
    if (paid) {
      bucket.paid = round2(bucket.paid + amount)
      mxn.paid = round2(mxn.paid + amountMxn)
    } else {
      bucket.pending = round2(bucket.pending + amount)
      mxn.pending = round2(mxn.pending + amountMxn)
    }
    if (isOverdue(payment.due_date, payment.status, today)) overdueCount += 1
    byCurrency.set(currency, bucket)

    const commission = toMxn(paymentCommission(payment), Number(payment.campaign.fx_rate_mxn))
    commissionMxn = round2(commissionMxn + commission)
    if (!payment.campaign.commission_paid) commissionPendingMxn = round2(commissionPendingMxn + commission)
  }

  return {
    byCurrency: CURRENCY_ORDER.filter((code) => byCurrency.has(code)).map((currency) => ({
      currency,
      ...byCurrency.get(currency)!,
    })),
    mxn,
    overdueCount,
    commissionMxn,
    commissionPendingMxn,
  }
}

export type CampaignCommissionRow = {
  campaignId: string
  company: string
  campaign: string
  currency: Currency
  pct: number
  /** Cuántos de sus cobros entran en el mes. */
  payments: number
  /** En la moneda de la campaña. */
  amount: number
  amountMxn: number
  paid: boolean
}

export type CampaignCommissions = {
  /** Pendientes primero; dentro de cada grupo, de mayor a menor en pesos. */
  rows: CampaignCommissionRow[]
  totalMxn: number
  pendingMxn: number
}

/**
 * La comisión del mes campaña por campaña, para el desglose del Inicio. Suma
 * cobro por cobro igual que summarizeMonthIncome, así que sus totales cuadran
 * al centavo con la tarjeta y con el resumen.
 */
export function commissionByCampaign(payments: readonly PaymentWithCampaign[]): CampaignCommissions {
  const byCampaign = new Map<string, CampaignCommissionRow>()
  let totalMxn = 0
  let pendingMxn = 0

  for (const payment of payments) {
    const { campaign } = payment
    const amount = paymentCommission(payment)
    const amountMxn = toMxn(amount, Number(campaign.fx_rate_mxn))
    const row = byCampaign.get(campaign.id) ?? {
      campaignId: campaign.id,
      company: campaign.company?.name ?? '—',
      campaign: campaign.name,
      currency: campaign.currency as Currency,
      pct: Number(campaign.commission_pct),
      payments: 0,
      amount: 0,
      amountMxn: 0,
      paid: Boolean(campaign.commission_paid),
    }
    row.payments += 1
    row.amount = round2(row.amount + amount)
    row.amountMxn = round2(row.amountMxn + amountMxn)
    byCampaign.set(campaign.id, row)

    totalMxn = round2(totalMxn + amountMxn)
    if (!row.paid) pendingMxn = round2(pendingMxn + amountMxn)
  }

  const rows = [...byCampaign.values()].sort(
    (a, b) => Number(a.paid) - Number(b.paid) || b.amountMxn - a.amountMxn,
  )
  return { rows, totalMxn, pendingMxn }
}
