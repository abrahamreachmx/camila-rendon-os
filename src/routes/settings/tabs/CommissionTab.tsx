import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LoadingRows } from '@/components/data/LoadingRows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSettings, updateSettings } from '@/lib/api/settings'
import { CURRENCIES } from '@/lib/money'

export function CommissionTab() {
  const queryClient = useQueryClient()
  const { data: settings, isPending } = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  const [pct, setPct] = useState('')
  const [currency, setCurrency] = useState('MXN')

  useEffect(() => {
    if (!settings) return
    setPct(String(settings.commission_pct))
    setCurrency(settings.default_currency)
  }, [settings])

  const save = useMutation({
    mutationFn: () =>
      updateSettings({ commission_pct: Number(pct), default_currency: currency }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Configuración guardada.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isPending) return <LoadingRows rows={2} />

  const pctNumber = Number(pct)
  const invalid = !Number.isFinite(pctNumber) || pctNumber < 0 || pctNumber > 100

  return (
    <div className="max-w-[420px] space-y-5 rounded-lg border border-line bg-surface p-5">
      <div className="space-y-2">
        <Label htmlFor="commission">Comisión de la manager (%)</Label>
        <Input
          id="commission"
          type="number"
          min={0}
          max={100}
          step="0.5"
          value={pct}
          onChange={(event) => setPct(event.target.value)}
        />
        <p className="text-[13px] text-ink-muted">
          Se aplica a las campañas nuevas. Las que ya existen conservan el porcentaje con el que se crearon.
        </p>
        {invalid && <p className="text-[13px] text-overdue">Debe ser un número entre 0 y 100.</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Moneda por defecto</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((code) => (
              <SelectItem key={code} value={code}>{code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={() => save.mutate()} disabled={invalid || save.isPending}>
        {save.isPending ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )
}
