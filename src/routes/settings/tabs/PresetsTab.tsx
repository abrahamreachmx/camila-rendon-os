import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LoadingRows } from '@/components/data/LoadingRows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSettings, readPresets, updateSettings } from '@/lib/api/settings'
import { round2 } from '@/lib/money'
import type { PaymentPreset } from '@/lib/paymentPlan'

function slugify(label: string): string {
  return label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plazo'
}

export function PresetsTab() {
  const queryClient = useQueryClient()
  const { data: settings, isPending } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const [presets, setPresets] = useState<PaymentPreset[]>([])

  useEffect(() => {
    if (settings) setPresets(readPresets(settings))
  }, [settings])

  const save = useMutation({
    mutationFn: () =>
      updateSettings({ payment_presets: presets as unknown as never }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Plazos guardados.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isPending) return <LoadingRows rows={3} />

  function update(index: number, patch: Partial<PaymentPreset>) {
    setPresets((current) => current.map((preset, i) => (i === index ? { ...preset, ...patch } : preset)))
  }

  function updatePart(presetIndex: number, partIndex: number, patch: Partial<{ pct: number; days: number }>) {
    setPresets((current) =>
      current.map((preset, i) =>
        i === presetIndex
          ? { ...preset, parts: preset.parts.map((part, j) => (j === partIndex ? { ...part, ...patch } : part)) }
          : preset,
      ),
    )
  }

  const sums = presets.map((preset) => round2(preset.parts.reduce((acc, part) => acc + part.pct, 0)))
  const firstBad = sums.findIndex((sum) => sum !== 100)
  const hasError = firstBad !== -1
  const duplicateKeys = new Set(
    presets.map((p) => p.key).filter((key, i, all) => all.indexOf(key) !== i),
  )

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        Cada plazo reparte el total en partes. Los porcentajes de un plazo deben sumar 100 %.
      </p>

      <div className="space-y-3">
        {presets.map((preset, presetIndex) => (
          <div key={presetIndex} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor={`preset-${presetIndex}`}>Nombre del plazo</Label>
                <Input
                  id={`preset-${presetIndex}`}
                  value={preset.label}
                  onChange={(e) => update(presetIndex, { label: e.target.value, key: slugify(e.target.value) })}
                />
              </div>
              <Button variant="ghost" size="icon" aria-label={`Eliminar ${preset.label}`}
                onClick={() => setPresets(presets.filter((_, i) => i !== presetIndex))}>
                <Trash2 className="size-4 text-overdue" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {preset.parts.map((part, partIndex) => (
                <div key={partIndex} className="flex flex-wrap items-center gap-2 text-[14px]">
                  <Input type="number" className="w-24" min={0} max={100} step="0.01" value={part.pct}
                    aria-label="Porcentaje"
                    onChange={(e) => updatePart(presetIndex, partIndex, { pct: Number(e.target.value) })} />
                  <span className="text-ink-muted">% a los</span>
                  <Input type="number" className="w-24" min={0} step="1" value={part.days}
                    aria-label="Días"
                    onChange={(e) => updatePart(presetIndex, partIndex, { days: Number(e.target.value) })} />
                  <span className="text-ink-muted">días de la fecha base</span>
                  {preset.parts.length > 1 && (
                    <Button variant="ghost" size="icon" aria-label="Quitar parte"
                      onClick={() => update(presetIndex, {
                        parts: preset.parts.filter((_, j) => j !== partIndex),
                      })}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Button variant="outline" size="sm"
                onClick={() => update(presetIndex, { parts: [...preset.parts, { pct: 0, days: 30 }] })}>
                <Plus className="size-4" /> Agregar parte
              </Button>
              <span className={sums[presetIndex] === 100 ? 'text-[13px] text-paid' : 'text-[13px] text-overdue'}>
                Suma {sums[presetIndex]} %
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline"
          onClick={() => setPresets([...presets, {
            key: `plazo-${presets.length + 1}`, label: 'Plazo nuevo', parts: [{ pct: 100, days: 30 }],
          }])}>
          <Plus className="size-4" /> Nuevo plazo
        </Button>
        <Button onClick={() => save.mutate()}
          disabled={hasError || duplicateKeys.size > 0 || save.isPending}>
          {save.isPending ? 'Guardando…' : 'Guardar plazos'}
        </Button>
        {hasError && (
          <span className="text-[13px] text-overdue">
            “{presets[firstBad].label}” suma {sums[firstBad]} % y debe sumar 100 %.
          </span>
        )}
        {duplicateKeys.size > 0 && (
          <span className="text-[13px] text-overdue">Hay dos plazos con el mismo nombre.</span>
        )}
      </div>
    </div>
  )
}
