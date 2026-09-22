import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LoadingRows } from '@/components/data/LoadingRows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSettings, readSalesGoals, updateSalesGoals } from '@/lib/api/settings'
import { monthlyTarget, quarterlyTarget, type SalesGoal } from '@/lib/goals'
import { formatMoney } from '@/lib/money'

export function GoalsTab() {
  const queryClient = useQueryClient()
  const { data: settings, isPending } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const [goals, setGoals] = useState<SalesGoal[]>([])

  useEffect(() => {
    if (settings) setGoals(readSalesGoals(settings))
  }, [settings])

  const save = useMutation({
    mutationFn: () => updateSalesGoals(goals),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Metas guardadas.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function update(index: number, patch: Partial<SalesGoal>) {
    setGoals(goals.map((goal, i) => (i === index ? { ...goal, ...patch } : goal)))
  }

  function addYear() {
    // El caso real es "el año que entra quiero al menos lo mismo".
    const latest = goals[0]
    const year = latest ? latest.year + 1 : new Date().getFullYear()
    setGoals([{ year, target_net_mxn: latest?.target_net_mxn ?? 0 }, ...goals])
  }

  const years = goals.map((goal) => goal.year)
  const duplicated = years.find((year, index) => years.indexOf(year) !== index)
  const outOfRange = goals.find((goal) => !Number.isInteger(goal.year) || goal.year < 2000 || goal.year > 2100)
  const invalidAmount = goals.find(
    (goal) => !Number.isFinite(goal.target_net_mxn) || goal.target_net_mxn <= 0,
  )

  const error = duplicated
    ? `Hay dos metas para el año ${duplicated}.`
    : outOfRange
      ? 'El año debe estar entre 2000 y 2100.'
      : invalidAmount
        ? `La meta de ${invalidAmount.year} debe ser mayor que cero. Si no quieres meta ese año, elimínala.`
        : null

  if (isPending) return <LoadingRows rows={3} />

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <p className="text-[13px] text-ink-muted">
          La meta se mide sobre las ventas netas consolidadas en pesos y se reparte en partes
          iguales entre los doce meses del año.
        </p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Una campaña cuenta en el mes de su publicación. Si no tiene fecha de publicación, cuenta
          en el mes en que se creó.
        </p>
      </div>

      {goals.length === 0 && (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-[13px] text-ink-muted">
          Aún no hay metas. Agrega el año en curso para ver el avance en el Inicio.
        </p>
      )}

      {goals.map((goal, index) => (
        <div key={index} className="rounded-lg border border-line bg-surface p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor={`anio-${index}`}>Año</Label>
              <Input
                id={`anio-${index}`}
                type="number"
                min={2000}
                max={2100}
                step={1}
                className="w-28"
                value={goal.year}
                onChange={(event) => update(index, { year: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor={`meta-${index}`}>Meta anual (MXN)</Label>
              <Input
                id={`meta-${index}`}
                type="number"
                min={0}
                step={10000}
                className="w-48"
                value={goal.target_net_mxn}
                onChange={(event) => update(index, { target_net_mxn: Number(event.target.value) })}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar la meta de ${goal.year}`}
              onClick={() => setGoals(goals.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4 text-overdue" />
            </Button>
          </div>
          <p className="mt-2 text-[13px] text-ink-muted">
            {formatMoney(goal.target_net_mxn, 'MXN')} al año · equivale a{' '}
            {formatMoney(monthlyTarget(goal.target_net_mxn), 'MXN')} al mes y{' '}
            {formatMoney(quarterlyTarget(goal.target_net_mxn), 'MXN')} al trimestre.
          </p>
        </div>
      ))}

      {error && <p className="text-[13px] text-overdue">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save.mutate()} disabled={Boolean(error) || save.isPending}>
          {save.isPending ? 'Guardando…' : 'Guardar metas'}
        </Button>
        <Button variant="outline" onClick={addYear}>
          <Plus className="size-4" /> Agregar año
        </Button>
      </div>
    </div>
  )
}
