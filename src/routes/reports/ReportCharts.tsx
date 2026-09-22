import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { formatMoney, formatMoneyShort } from '@/lib/money'
import type { ReportSummary } from '@/types'

/**
 * Tres lecturas, tres formas:
 * · ventas por mes  -> magnitud en el tiempo, un solo tono (no es identidad)
 * · cobranza        -> tres estados, y ahí sí manda la paleta de estatus del §7
 * · marcas          -> ranking de magnitud, un solo tono
 * Nunca dos ejes verticales.
 */
const INK = '#2A2320'
const MUTED = '#8B8079'
const LINE = '#E3D9CE'
const PLUM = '#6B2D4F'

const AXIS = { stroke: LINE, tick: { fill: MUTED, fontSize: 12 }, tickLine: false }

function TooltipBox({
  active, payload, label, currencyLabel,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string
  currencyLabel?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-sm border border-line bg-surface px-3 py-2 text-[13px] shadow-[0_6px_18px_rgba(42,35,32,.10)]">
      <p className="font-semibold">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center gap-1.5 tabular-nums">
          {entry.color && (
            <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
          )}
          {entry.name ? `${entry.name}: ` : ''}
          {formatMoney(Number(entry.value ?? 0), 'MXN')}
          {currencyLabel ? ` ${currencyLabel}` : ''}
        </p>
      ))}
    </div>
  )
}

export function MonthlySalesChart({
  data,
  monthlyGoal,
}: {
  data: ReportSummary['monthly_sales']
  /** Meta mensual del año consultado. Si no hay meta capturada, no se dibuja. */
  monthlyGoal?: number | null
}) {
  const rows = data.map((row) => ({ mes: monthLabel(row.month), neto: Number(row.net_mxn) }))
  return (
    <ChartCard title="Ventas netas por mes" hint="Consolidado en pesos">
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} stroke={LINE} />
            <XAxis dataKey="mes" {...AXIS} axisLine={{ stroke: LINE }} />
            <YAxis {...AXIS} axisLine={false} width={64}
              tickFormatter={(value: number) => formatMoneyShort(value, 'MXN')} />
            <Tooltip cursor={{ fill: '#EFE7DE' }} content={<TooltipBox />} />
            {monthlyGoal ? (
              <ReferenceLine
                y={monthlyGoal}
                stroke={MUTED}
                strokeDasharray="4 4"
                label={{ value: 'Meta mensual', position: 'insideTopRight', fill: MUTED, fontSize: 11 }}
              />
            ) : null}
            <Bar isAnimationActive={false} dataKey="neto" name="Neto" fill={PLUM} radius={[4, 4, 0, 0]} maxBarSize={44}>
              <LabelList dataKey="neto" position="top" offset={8}
                formatter={(value) => formatMoneyShort(Number(value ?? 0), 'MXN')}
                style={{ fill: INK, fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

export function CollectionsChart({ data }: { data: ReportSummary['collections'] }) {
  const rows = [
    {
      periodo: 'Cobranza',
      Cobrado: Number(data.collected_mxn),
      'Por cobrar': Number(data.pending_mxn),
      Vencido: Number(data.overdue_mxn),
    },
  ]
  const total = rows[0].Cobrado + rows[0]['Por cobrar'] + rows[0].Vencido

  return (
    <ChartCard title="Cobranza del periodo" hint="Cobrado, por cobrar y vencido">
      {total === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid horizontal={false} stroke={LINE} />
            <XAxis type="number" {...AXIS} axisLine={{ stroke: LINE }}
              tickFormatter={(value: number) => formatMoneyShort(value, 'MXN')} />
            <YAxis type="category" dataKey="periodo" hide />
            <Tooltip cursor={{ fill: '#EFE7DE' }} content={<TooltipBox />} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
              wrapperStyle={{ fontSize: 13, color: INK, paddingTop: 12 }} />
            {/* stroke blanco = separador de 2 px entre segmentos */}
            <Bar isAnimationActive={false} dataKey="Cobrado"    stackId="c" fill="#3E7C5A" stroke="#FFFFFF" strokeWidth={2} maxBarSize={56} />
            <Bar isAnimationActive={false} dataKey="Por cobrar" stackId="c" fill="#C08A2E" stroke="#FFFFFF" strokeWidth={2} maxBarSize={56} />
            <Bar isAnimationActive={false} dataKey="Vencido"    stackId="c" fill="#B4433B" stroke="#FFFFFF" strokeWidth={2} maxBarSize={56}
              radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

export function TopCompaniesChart({ data }: { data: ReportSummary['top_companies'] }) {
  const rows = [...data].sort((a, b) => Number(a.net_mxn) - Number(b.net_mxn))
    .map((row) => ({ marca: row.company, neto: Number(row.net_mxn) }))

  return (
    <ChartCard title="Ventas por marca" hint="Las cinco primeras del periodo">
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 56, bottom: 0, left: 8 }}>
            <CartesianGrid horizontal={false} stroke={LINE} />
            <XAxis type="number" {...AXIS} axisLine={{ stroke: LINE }}
              tickFormatter={(value: number) => formatMoneyShort(value, 'MXN')} />
            <YAxis type="category" dataKey="marca" {...AXIS} axisLine={false} width={120} />
            <Tooltip cursor={{ fill: '#EFE7DE' }} content={<TooltipBox />} />
            <Bar isAnimationActive={false} dataKey="neto" name="Neto" radius={[0, 4, 4, 0]} maxBarSize={26}>
              {rows.map((_, index) => <Cell key={index} fill={PLUM} />)}
              <LabelList dataKey="neto" position="right" offset={8}
                formatter={(value) => formatMoneyShort(Number(value ?? 0), 'MXN')}
                style={{ fill: INK, fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

function ChartCard({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h3 className="text-[16px] font-semibold">{title}</h3>
      <p className="mb-2 text-[13px] text-ink-muted">{hint}</p>
      {children}
    </section>
  )
}

function Empty() {
  return <p className="py-16 text-center text-[13px] text-ink-muted">Sin datos en este periodo.</p>
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number)
  return `${MONTHS[m - 1]} ${String(year).slice(2)}`
}
