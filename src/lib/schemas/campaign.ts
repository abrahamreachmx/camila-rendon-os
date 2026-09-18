import { z } from 'zod'
import { CURRENCIES } from '@/lib/money'

export const campaignItemSchema = z.object({
  service_id: z.string().uuid().nullable(),
  description: z.string().trim().min(2, 'Describe el servicio.').max(200),
  quantity: z.number().positive('La cantidad debe ser mayor que cero.'),
  unit_price: z.number().min(0, 'El precio no puede ser negativo.'),
  paid_media: z.boolean(),
  collab: z.boolean(),
})

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.').nullable()

export const campaignSchema = z
  .object({
    company_id: z.string().uuid('Elige una marca.'),
    contact_id: z.string().uuid().nullable(),
    name: z.string().trim().min(2, 'Ponle nombre a la campaña.').max(120),
    status_id: z.string().uuid().nullable(),
    currency: z.enum(CURRENCIES),
    fx_rate_mxn: z.number().positive('El tipo de cambio debe ser mayor que cero.'),
    content_due_date: isoDate,
    publish_date: isoDate,
    signed_at: isoDate,
    contract_signed: z.boolean(),
    brief: z.string().nullable(),
    notes: z.string().nullable(),
    items: z.array(campaignItemSchema),
  })
  .refine((data) => data.currency !== 'MXN' || data.fx_rate_mxn === 1, {
    message: 'Una campaña en pesos mexicanos siempre lleva tipo de cambio 1.',
    path: ['fx_rate_mxn'],
  })

export type CampaignFormValues = z.infer<typeof campaignSchema>
