import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import { formatDateLong } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { PDF_COLORS, pdfStyles as s } from '@/pdf/theme'
import type { CampaignListRow, ReportSummary, Settings } from '@/types'

export type ReportPdfData = {
  title: string
  summary: ReportSummary
  previous: ReportSummary | null
  campaigns: CampaignListRow[]
  settings: Settings
  logoUrl: string | null
}

/**
 * Dos páginas. Las gráficas no se dibujan: react-pdf no renderiza Recharts,
 * así que lo que en pantalla es la barra mensual aquí es la tabla "Ventas por mes".
 */
export function ReportPdf({ data }: { data: ReportPdfData }) {
  const { summary, settings } = data
  const mxn = (value: number) => formatMoney(value, 'MXN')

  const kpis: { label: string; value: string; delta: number | null }[] = [
    { label: 'Ventas netas', value: mxn(summary.sales.net_mxn), delta: delta(summary, data.previous, (s2) => s2.sales.net_mxn) },
    { label: 'Ventas brutas', value: mxn(summary.sales.gross_mxn), delta: delta(summary, data.previous, (s2) => s2.sales.gross_mxn) },
    { label: 'Cobrado', value: mxn(summary.collections.collected_mxn), delta: delta(summary, data.previous, (s2) => s2.collections.collected_mxn) },
    { label: 'Por cobrar', value: mxn(summary.collections.pending_mxn), delta: delta(summary, data.previous, (s2) => s2.collections.pending_mxn) },
    { label: 'Vencido', value: mxn(summary.collections.overdue_mxn), delta: delta(summary, data.previous, (s2) => s2.collections.overdue_mxn) },
    { label: 'Comisiones', value: mxn(summary.commissions.generated_mxn), delta: delta(summary, data.previous, (s2) => s2.commissions.generated_mxn) },
    { label: 'Campañas', value: String(summary.campaigns.total), delta: delta(summary, data.previous, (s2) => s2.campaigns.total) },
    { label: 'Ticket promedio', value: mxn(summary.sales.avg_ticket_mxn), delta: delta(summary, data.previous, (s2) => s2.sales.avg_ticket_mxn) },
  ]

  return (
    <Document title={data.title} author={settings.brand_name}>
      <Page size="LETTER" style={s.page}>
        <Header settings={settings} logoUrl={data.logoUrl} />
        <Text style={{ fontFamily: 'Fraunces', fontWeight: 500, fontSize: 20, marginTop: 6 }}>
          {data.title}
        </Text>
        <Text style={{ color: PDF_COLORS.muted, marginTop: 2 }}>
          {formatDateLong(summary.period.from)} — {formatDateLong(summary.period.to)}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 20 }}>
          {kpis.map((kpi) => (
            <View key={kpi.label} style={{ width: '25%', paddingRight: 10, marginBottom: 18 }}>
              <Text style={{ fontFamily: 'Fraunces', fontWeight: 500, fontSize: 17 }}>{kpi.value}</Text>
              <Text style={{ fontSize: 9, color: PDF_COLORS.muted, marginTop: 2 }}>{kpi.label}</Text>
              {kpi.delta !== null && (
                <Text style={{ fontSize: 8, marginTop: 1, color: deltaColor(kpi.delta) }}>
                  {kpi.delta > 0 ? '▲ +' : kpi.delta < 0 ? '▼ ' : '– '}
                  {kpi.delta} % vs periodo anterior
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={s.ruleSoft} />

        <Table
          title="Ventas por mes"
          head={['Mes', 'Neto']}
          widths={[1, 0]}
          rows={summary.monthly_sales.map((row) => [row.month, mxn(Number(row.net_mxn))])}
        />

        <View style={{ marginTop: 18 }}>
          <Table
            title="Campañas por estatus"
            head={['Estatus', 'Campañas']}
            widths={[1, 0]}
            rows={summary.campaigns.by_status.map((row) => [row.status ?? 'Sin estatus', String(row.count)])}
          />
        </View>

        <Footer settings={settings} />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Header settings={settings} logoUrl={data.logoUrl} />

        <Table
          title="Campañas del periodo"
          head={['Marca', 'Campaña', 'Neto', 'Neto MXN']}
          widths={[1, 1, 0, 0]}
          rows={data.campaigns.map((campaign) => [
            campaign.company?.name ?? '—',
            campaign.name,
            formatMoney(Number(campaign.net_amount), campaign.currency as 'MXN' | 'USD' | 'COP'),
            mxn(Number(campaign.net_amount) * Number(campaign.fx_rate_mxn)),
          ])}
        />

        <View style={{ marginTop: 20 }}>
          <Table
            title="Top marcas"
            head={['Marca', 'Campañas', 'Neto MXN']}
            widths={[1, 0, 0]}
            rows={summary.top_companies.map((row) => [row.company, String(row.count), mxn(Number(row.net_mxn))])}
          />
        </View>

        <View style={{ marginTop: 20 }}>
          <Table
            title="Top servicios"
            head={['Servicio', 'Unidades', 'Ingreso MXN']}
            widths={[1, 0, 0]}
            rows={summary.top_services.map((row) => [
              row.service, String(Number(row.units)), mxn(Number(row.revenue_mxn)),
            ])}
          />
        </View>

        <Footer settings={settings} />
      </Page>
    </Document>
  )
}

function Header({ settings, logoUrl }: { settings: Settings; logoUrl: string | null }) {
  return (
    <>
      <View style={s.headerRow}>
        <View>
          <Text style={s.brandName}>{settings.brand_name}</Text>
          {settings.brand_handle ? <Text style={s.brandHandle}>{settings.brand_handle}</Text> : null}
        </View>
        {logoUrl ? <Image src={logoUrl} style={s.logo} /> : null}
      </View>
      <View style={s.rule} />
    </>
  )
}

function Footer({ settings }: { settings: Settings }) {
  return (
    <View style={s.footer} fixed>
      <Text>{settings.brand_name}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`} />
    </View>
  )
}

function Table({
  title, head, rows, widths,
}: {
  title: string
  head: string[]
  rows: string[][]
  /** 1 = la columna se estira; 0 = ancho fijo alineado a la derecha. */
  widths: number[]
}) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{title}</Text>
      <View style={s.tableHead}>
        {head.map((label, index) => (
          <Text key={index} style={[s.th, cell(widths[index])]}>{label}</Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <Text style={{ fontSize: 9, color: PDF_COLORS.muted, paddingVertical: 8 }}>
          Sin datos en este periodo.
        </Text>
      ) : (
        rows.map((row, rowIndex) => (
          <View key={rowIndex} style={[s.tableRow, { paddingVertical: 5 }]} wrap={false}>
            {row.map((value, index) => (
              <Text key={index} style={cell(widths[index])}>{value}</Text>
            ))}
          </View>
        ))
      )}
    </View>
  )
}

function cell(width: number) {
  return width === 1
    ? { flex: 1, paddingRight: 8, fontSize: 9 }
    : { width: 96, textAlign: 'right' as const, fontSize: 9 }
}

function delta(
  current: ReportSummary,
  previous: ReportSummary | null,
  pick: (summary: ReportSummary) => number,
): number | null {
  if (!previous) return null
  const before = pick(previous)
  if (before === 0) return pick(current) === 0 ? 0 : null
  return Math.round(((pick(current) - before) / Math.abs(before)) * 1000) / 10
}

function deltaColor(value: number): string {
  if (value > 0) return '#3E7C5A'
  if (value < 0) return '#B4433B'
  return PDF_COLORS.muted
}
