import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatMoney, round2, sumBy, type Currency } from '@/lib/money'
import type { CampaignItemInput, Service } from '@/types'

const FREE_LINE = 'libre'

/**
 * Desglose de servicios con totales en vivo. El bruto que se ve aquí es el
 * mismo que calculará el trigger al guardar: `sum(round(cantidad × precio))`.
 */
export function CampaignItemsEditor({
  items,
  services,
  currency,
  onChange,
}: {
  items: CampaignItemInput[]
  services: Service[]
  currency: Currency
  onChange: (items: CampaignItemInput[]) => void
}) {
  function update(index: number, patch: Partial<CampaignItemInput>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addFromService(serviceId: string) {
    if (serviceId === FREE_LINE) {
      onChange([
        ...items,
        { service_id: null, description: '', quantity: 1, unit_price: 0, paid_media: false, collab: false },
      ])
      return
    }
    const service = services.find((s) => s.id === serviceId)
    if (!service) return
    onChange([
      ...items,
      {
        service_id: service.id,
        description: service.name,
        quantity: 1,
        unit_price: Number(service.default_price),
        paid_media: service.paid_media_default,
        collab: false,
      },
    ])
  }

  const gross = sumBy(items, (item) => round2(item.quantity * item.unit_price))

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-surface-2 text-[13px]">
                <th scope="col" className="px-3 py-2.5 text-left font-semibold">Servicio</th>
                <th scope="col" className="w-24 px-3 py-2.5 text-right font-semibold">Cantidad</th>
                <th scope="col" className="w-36 px-3 py-2.5 text-right font-semibold">Precio</th>
                <th scope="col" className="w-36 px-3 py-2.5 text-right font-semibold">Total</th>
                <th scope="col" className="w-12 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t border-line align-top">
                  <td className="px-3 py-2.5">
                    <Input
                      aria-label={`Descripción de la línea ${index + 1}`}
                      value={item.description}
                      placeholder="Describe el servicio"
                      onChange={(event) => update(index, { description: event.target.value })}
                    />
                    <div className="mt-2 flex flex-wrap gap-4 text-[13px]">
                      <label className="flex items-center gap-1.5">
                        <Checkbox checked={item.paid_media}
                          onCheckedChange={(checked) => update(index, { paid_media: checked === true })} />
                        Con pauta
                      </label>
                      <label className="flex items-center gap-1.5">
                        <Checkbox checked={item.collab}
                          onCheckedChange={(checked) => update(index, { collab: checked === true })} />
                        En colaboración
                      </label>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Input type="number" min="0.01" step="0.5" className="text-right"
                      aria-label={`Cantidad de la línea ${index + 1}`}
                      value={item.quantity}
                      onChange={(event) => update(index, { quantity: Number(event.target.value) })} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Input type="number" min="0" step="1" className="text-right"
                      aria-label={`Precio de la línea ${index + 1}`}
                      value={item.unit_price}
                      onChange={(event) => update(index, { unit_price: Number(event.target.value) })} />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(round2(item.quantity * item.unit_price), currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button variant="ghost" size="icon" aria-label={`Quitar línea ${index + 1}`}
                      onClick={() => onChange(items.filter((_, i) => i !== index))}>
                      <Trash2 className="size-4 text-overdue" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-surface-2">
                <td colSpan={3} className="px-3 py-2.5 text-right font-semibold">Bruto</td>
                <td data-testid="items-gross" className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {formatMoney(gross, currency)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-2">
          <Label htmlFor="add-service">Agregar del catálogo</Label>
          <Select value="" onValueChange={addFromService}>
            <SelectTrigger id="add-service" className="w-[280px]">
              <SelectValue placeholder="Elige un servicio" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} — {formatMoney(Number(service.default_price), service.currency as Currency)}
                </SelectItem>
              ))}
              <SelectItem value={FREE_LINE}>Línea libre…</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => addFromService(FREE_LINE)}>
          <Plus className="size-4" /> Línea libre
        </Button>
      </div>
    </div>
  )
}
