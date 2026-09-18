import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSettings, readPresets } from '@/lib/api/settings'
import { todayIso } from '@/lib/dates'
import { formatMoney, round2, sumBy, type Currency } from '@/lib/money'
import { generatePaymentPlan, type PlanRow } from '@/lib/paymentPlan'

/**
 * Elegir un plazo rellena las filas; después se pueden editar a mano.
 * El total de las filas se compara siempre contra el total que se quiere cobrar,
 * porque un plan que no cuadra es un cobro perdido.
 */
export function PaymentPlanGenerator({
  rows,
  onChange,
  total,
  currency,
  baseDate,
  onPresetLabelChange,
}: {
  rows: PlanRow[]
  onChange: (rows: PlanRow[]) => void
  total: number
  currency: Currency
  baseDate: string | null
  onPresetLabelChange?: (label: string) => void
}) {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const presets = settings ? readPresets(settings) : []
  const [presetKey, setPresetKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const base = baseDate || todayIso()

  function apply(key: string) {
    setPresetKey(key)
    const preset = presets.find((item) => item.key === key)
    if (!preset) return
    try {
      onChange(generatePaymentPlan(preset, base, total))
      onPresetLabelChange?.(preset.label)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo generar el plan.')
    }
  }

  function update(index: number, patch: Partial<PlanRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const planTotal = sumBy(rows, (row) => row.amount)
  const difference = round2(total - planTotal)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="payment-preset">Plazo de pago</Label>
          <Select value={presetKey} onValueChange={apply}>
            <SelectTrigger id="payment-preset" className="w-[280px]">
              <SelectValue placeholder="Elige un plazo" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.key} value={preset.key}>{preset.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {presetKey && (
          <Button variant="outline" onClick={() => apply(presetKey)}>
            <Wand2 className="size-4" /> Regenerar
          </Button>
        )}
      </div>

      {error && <p className="text-[13px] text-overdue">{error}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[420px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-surface-2 text-[13px]">
                <th scope="col" className="px-3 py-2.5 text-left font-semibold">Vence</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Monto</th>
                <th scope="col" className="w-12 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-line">
                  <td className="px-3 py-2.5">
                    <Input type="date" value={row.due_date}
                      aria-label={`Vencimiento del cobro ${index + 1}`}
                      onChange={(event) => update(index, { due_date: event.target.value })} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Input type="number" min="0" step="0.01" className="text-right"
                      aria-label={`Monto del cobro ${index + 1}`}
                      value={row.amount}
                      onChange={(event) => update(index, { amount: Number(event.target.value) })} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button variant="ghost" size="icon" aria-label={`Quitar cobro ${index + 1}`}
                      onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      <Trash2 className="size-4 text-overdue" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-surface-2">
                <td className="px-3 py-2.5 text-right font-semibold">Suma del plan</td>
                <td data-testid="plan-total" className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {formatMoney(planTotal, currency)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm"
          onClick={() => onChange([...rows, { due_date: base, amount: 0, sort_order: rows.length + 1 }])}>
          <Plus className="size-4" /> Agregar cobro
        </Button>
        {rows.length > 0 && difference !== 0 && (
          <span className="text-[13px] text-pending">
            El plan cubre {formatMoney(planTotal, currency)} de {formatMoney(total, currency)}
            {' '}({difference > 0 ? 'faltan' : 'sobran'} {formatMoney(Math.abs(difference), currency)}).
          </span>
        )}
        {rows.length > 0 && difference === 0 && total > 0 && (
          <span className="text-[13px] text-paid">El plan cubre el total.</span>
        )}
      </div>
    </div>
  )
}
