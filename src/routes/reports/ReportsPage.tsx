import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileDown, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { MoneyCell } from '@/components/data/MoneyCell'
import { StatusBadge } from '@/components/data/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { listCampaigns } from '@/lib/api/campaigns'
import { getSignedUrl } from '@/lib/api/invoices'
import { deleteReport, getReportSummary, listReports, readSnapshot, saveReport } from '@/lib/api/reports'
import { getSettings } from '@/lib/api/settings'
import { calcCommission } from '@/lib/commission'
import { downloadCsv, toCsv, type CsvColumn } from '@/lib/csv'
import { formatDateLong, formatDateShort } from '@/lib/dates'
import { formatMoney, toMxn, type Currency } from '@/lib/money'
import { currentMonth, previousRange, type PeriodRange } from '@/lib/periods'
import { KpiGrid } from '@/routes/reports/KpiGrid'
import { PeriodPicker } from '@/routes/reports/PeriodPicker'
import { CollectionsChart, MonthlySalesChart, TopCompaniesChart } from '@/routes/reports/ReportCharts'
import type { CampaignListRow, ReportSummary, SavedReport } from '@/types'

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const [range, setRange] = useState<PeriodRange>(() => currentMonth())
  const [opened, setOpened] = useState<SavedReport | null>(null)
  const previous = previousRange(range)

  const { data: live, isPending } = useQuery({
    queryKey: ['report', range.from, range.to],
    queryFn: () => getReportSummary(range.from, range.to),
  })
  const { data: livePrevious = null } = useQuery({
    queryKey: ['report', previous.from, previous.to],
    queryFn: () => getReportSummary(previous.from, previous.to),
  })
  const { data: allCampaigns = [] } = useQuery({
    queryKey: ['campaigns', {}],
    queryFn: () => listCampaigns(),
  })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: saved = [] } = useQuery({ queryKey: ['reports'], queryFn: listReports })
  const { data: logoUrl = null } = useQuery({
    queryKey: ['brand-logo', settings?.brand_logo_path],
    queryFn: () => (settings?.brand_logo_path ? getSignedUrl(settings.brand_logo_path) : null),
    enabled: Boolean(settings?.brand_logo_path),
  })

  // Un reporte guardado se lee de su snapshot, nunca se recalcula.
  const summary: ReportSummary | undefined = opened ? readSnapshot(opened) : live
  const comparison = opened ? null : livePrevious
  const periodTitle = opened ? opened.title : `Resultados · ${range.label}`

  const campaignsInPeriod = summary ? inPeriod(allCampaigns, summary) : []

  const store = useMutation({
    mutationFn: () =>
      saveReport({
        period_type: range.type,
        period_start: range.from,
        period_end: range.to,
        title: `Resultados · ${range.label}`,
        snapshot: live!,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Reporte guardado. Reabrirlo mostrará estos mismos números.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      setOpened(null)
      toast.success('Reporte eliminado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function exportCsv() {
    if (!summary) return
    const columns: CsvColumn<CampaignListRow>[] = [
      { header: 'Marca', value: (row) => row.company?.name ?? '' },
      { header: 'Campaña', value: (row) => row.name },
      { header: 'Estatus', value: (row) => row.status?.name ?? '' },
      { header: 'Moneda', value: (row) => row.currency },
      { header: 'Bruto', value: (row) => Number(row.gross_amount) },
      { header: 'Neto', value: (row) => Number(row.net_amount) },
      { header: 'Neto MXN', value: (row) => toMxn(Number(row.net_amount), Number(row.fx_rate_mxn)) },
      { header: 'Comisión', value: (row) => calcCommission(Number(row.net_amount), Number(row.commission_pct)) },
      { header: 'Comisión pagada', value: (row) => (row.commission_paid ? 'Sí' : 'No') },
      { header: 'Publicación', value: (row) => row.publish_date ?? '' },
    ]
    downloadCsv(`${slug(periodTitle)}.csv`, toCsv(campaignsInPeriod, columns))
    toast.success('CSV descargado.')
  }

  async function exportPdf() {
    if (!summary || !settings) return
    try {
      // Igual que en la cotización: react-pdf sólo baja si se pide el PDF.
      const [{ downloadOrShare, toPdfBlob }, { ReportPdf }] = await Promise.all([
        import('@/pdf/downloadPdf'),
        import('@/pdf/ReportPdf'),
      ])
      const blob = await toPdfBlob(
        <ReportPdf
          data={{
            title: periodTitle, summary, previous: comparison,
            campaigns: campaignsInPeriod, settings, logoUrl,
          }}
        />,
      )
      await downloadOrShare(blob, `${slug(periodTitle)}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el PDF.')
    }
  }

  const campaignColumns: Column<CampaignListRow>[] = [
    {
      key: 'company', header: 'Marca', sortValue: (row) => row.company?.name ?? '',
      cell: (row) => row.company?.name ?? '—',
    },
    {
      key: 'name', header: 'Campaña', sortValue: (row) => row.name,
      cell: (row) => <span className="font-heading text-[16px]">{row.name}</span>,
    },
    {
      key: 'status', header: 'Estatus', hideOnMobile: true,
      cell: (row) => (row.status ? <StatusBadge label={row.status.name} color={row.status.color} /> : '—'),
    },
    {
      key: 'net', header: 'Neto', align: 'right',
      sortValue: (row) => toMxn(Number(row.net_amount), Number(row.fx_rate_mxn)),
      cell: (row) => <MoneyCell amount={row.net_amount} currency={row.currency as Currency} strong />,
    },
    {
      key: 'net_mxn', header: 'Neto MXN', align: 'right', hideOnMobile: true,
      sortValue: (row) => toMxn(Number(row.net_amount), Number(row.fx_rate_mxn)),
      cell: (row) => <MoneyCell amount={toMxn(Number(row.net_amount), Number(row.fx_rate_mxn))} />,
    },
    {
      key: 'publish', header: 'Publicación', align: 'right', hideOnMobile: true,
      sortValue: (row) => row.publish_date,
      cell: (row) => formatDateShort(row.publish_date),
    },
  ]

  return (
    <>
      <PageHeader
        title="Reportes"
        description={
          opened
            ? `Guardado el ${formatDateLong(opened.created_at.slice(0, 10))}. Los números no cambian aunque edites una campaña.`
            : 'Ventas, cobranza y comisiones del periodo, consolidado en pesos.'
        }
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={!summary}>
              <Download className="size-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => void exportPdf()} disabled={!summary || !settings}>
              <FileDown className="size-4" /> PDF
            </Button>
            {!opened && (
              <Button onClick={() => store.mutate()} disabled={!live || store.isPending}>
                <Save className="size-4" /> {store.isPending ? 'Guardando…' : 'Guardar reporte'}
              </Button>
            )}
            {opened && <Button variant="outline" onClick={() => setOpened(null)}>Volver al periodo actual</Button>}
          </>
        }
      />

      {!opened && <PeriodPicker range={range} onChange={setRange} />}

      {isPending || !summary ? (
        <LoadingRows rows={6} />
      ) : (
        <div className="space-y-8">
          <KpiGrid summary={summary} previous={comparison} />

          <div className="grid gap-4 lg:grid-cols-2">
            <MonthlySalesChart data={summary.monthly_sales} />
            <CollectionsChart data={summary.collections} />
            <div className="lg:col-span-2">
              <TopCompaniesChart data={summary.top_companies} />
            </div>
          </div>

          <section>
            <h2 className="mb-3 font-heading text-[20px]">Top servicios</h2>
            <DataTable
              rows={summary.top_services}
              getRowId={(row) => row.service}
              columns={[
                { key: 'service', header: 'Servicio', sortValue: (row) => row.service, cell: (row) => row.service },
                {
                  key: 'units', header: 'Unidades', align: 'right',
                  sortValue: (row) => Number(row.units), cell: (row) => Number(row.units),
                },
                {
                  key: 'revenue', header: 'Ingreso MXN', align: 'right',
                  sortValue: (row) => Number(row.revenue_mxn),
                  cell: (row) => <MoneyCell amount={row.revenue_mxn} strong />,
                },
              ]}
              emptyState={<EmptyState message="Sin servicios facturados en este periodo." />}
            />
          </section>

          <section>
            <h2 className="mb-3 font-heading text-[20px]">Campañas del periodo</h2>
            <DataTable
              rows={campaignsInPeriod}
              columns={campaignColumns}
              getRowId={(row) => row.id}
              emptyState={<EmptyState message="Ninguna campaña cae en este periodo." />}
            />
          </section>

          <section>
            <h2 className="mb-3 font-heading text-[20px]">Reportes guardados</h2>
            {saved.length === 0 ? (
              <EmptyState message="Todavía no has guardado ningún reporte. Guarda el actual para congelarlo." />
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                {saved.map((report) => (
                  <li key={report.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{report.title}</p>
                      <p className="text-[13px] text-ink-muted">
                        {formatDateLong(report.period_start)} — {formatDateLong(report.period_end)} · ventas netas{' '}
                        {formatMoney(readSnapshot(report).sales.net_mxn, 'MXN')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setOpened(report)}>Abrir</Button>
                    <Button variant="ghost" size="icon" aria-label={`Eliminar ${report.title}`}
                      onClick={() => remove.mutate(report.id)}>
                      <Trash2 className="size-4 text-overdue" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}

/** Mismo criterio que el RPC: publish_date, y si falta, la fecha de alta. */
function inPeriod(campaigns: CampaignListRow[], summary: ReportSummary): CampaignListRow[] {
  const { from, to } = summary.period
  return campaigns.filter((campaign) => {
    const date = campaign.publish_date ?? campaign.created_at.slice(0, 10)
    return date >= from && date <= to
  })
}

function slug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
