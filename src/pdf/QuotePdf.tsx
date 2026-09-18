import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import { formatDateLong } from '@/lib/dates'
import { formatMoney, type Currency } from '@/lib/money'
import { PDF_COLORS, pdfStyles as s } from '@/pdf/theme'
import type { QuoteItemSnapshot, Settings } from '@/types'

export type QuotePdfData = {
  folio: string
  issuedAt: string
  validUntil: string | null
  currency: Currency
  items: QuoteItemSnapshot[]
  total: number
  paymentTermsLabel: string | null
  notes: string | null
  companyName: string
  contactName: string | null
  contactEmail: string | null
  campaignName: string
  settings: Settings
  logoUrl: string | null
}

export function QuotePdf({ data }: { data: QuotePdfData }) {
  const { settings } = data

  return (
    <Document title={`Cotización ${data.folio}`} author={settings.brand_name}>
      <Page size="LETTER" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.brandName}>{settings.brand_name}</Text>
            {settings.brand_handle ? <Text style={s.brandHandle}>{settings.brand_handle}</Text> : null}
          </View>
          {data.logoUrl ? <Image src={data.logoUrl} style={s.logo} /> : null}
        </View>

        <View style={s.rule} />

        <View style={s.metaRow}>
          <View>
            <Text style={s.metaLabel}>Cotización</Text>
            <Text style={s.metaValue}>{data.folio}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Fecha</Text>
            <Text style={s.metaValue}>{formatDateLong(data.issuedAt)}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Válida hasta</Text>
            <Text style={s.metaValue}>{formatDateLong(data.validUntil)}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Moneda</Text>
            <Text style={s.metaValue}>{data.currency}</Text>
          </View>
        </View>

        <View style={s.ruleSoft} />

        <View style={{ marginTop: 10 }}>
          <Text style={s.sectionTitle}>Para</Text>
          <Text style={s.toName}>{data.companyName}</Text>
          {data.contactName ? (
            <Text style={{ marginTop: 2, color: PDF_COLORS.muted }}>
              {data.contactName}
              {data.contactEmail ? ` · ${data.contactEmail}` : ''}
            </Text>
          ) : null}
          <Text style={{ marginTop: 6 }}>{data.campaignName}</Text>
        </View>

        <View style={s.tableHead}>
          <Text style={[s.th, s.colDescription]}>Servicio</Text>
          <Text style={[s.th, s.colQty]}>Cantidad</Text>
          <Text style={[s.th, s.colPrice]}>Precio</Text>
          <Text style={[s.th, s.colTotal]}>Total</Text>
        </View>

        {data.items.map((item, index) => {
          const notes = [item.paid_media ? 'con pauta' : null, item.collab ? 'en colaboración' : null]
            .filter(Boolean)
            .join(' · ')
          return (
            <View key={index} style={s.tableRow} wrap={false}>
              <View style={s.colDescription}>
                <Text style={s.itemName}>{item.description}</Text>
                {notes ? <Text style={s.itemNote}>{notes}</Text> : null}
              </View>
              <Text style={s.colQty}>{formatQuantity(item.quantity)}</Text>
              <Text style={s.colPrice}>{formatMoney(item.unit_price, data.currency)}</Text>
              <Text style={s.colTotal}>{formatMoney(item.line_total, data.currency)}</Text>
            </View>
          )
        })}

        <View style={s.totalBox}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{formatMoney(data.total, data.currency)}</Text>
        </View>

        <View style={s.terms}>
          {data.paymentTermsLabel ? (
            <>
              <Text style={s.sectionTitle}>Condiciones de pago</Text>
              <Text style={s.termsText}>{data.paymentTermsLabel}</Text>
            </>
          ) : null}

          {data.notes ? (
            <View style={{ marginTop: 12 }}>
              <Text style={s.sectionTitle}>Notas</Text>
              <Text style={s.termsText}>{data.notes}</Text>
            </View>
          ) : null}

          {settings.quote_footer ? (
            <Text style={{ marginTop: 16, fontSize: 9, color: PDF_COLORS.muted }}>
              {settings.quote_footer}
            </Text>
          ) : null}
        </View>

        <View style={s.footer} fixed>
          <Text>{settings.brand_name}</Text>
          <Text>
            {[settings.brand_email, settings.brand_phone].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2)
}
