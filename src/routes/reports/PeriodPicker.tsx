import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  currentMonth, currentQuarter, customRange, nextRange, previousRange,
  type PeriodRange, type PeriodType,
} from '@/lib/periods'

export function PeriodPicker({
  range,
  onChange,
}: {
  range: PeriodRange
  onChange: (range: PeriodRange) => void
}) {
  function setType(type: PeriodType) {
    if (type === range.type) return
    if (type === 'mes') onChange(currentMonth())
    else if (type === 'trimestre') onChange(currentQuarter())
    else onChange(customRange(range.from, range.to))
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="inline-flex rounded-sm border border-line bg-surface p-0.5">
        {(['mes', 'trimestre', 'rango'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setType(type)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-[14px] capitalize transition-colors',
              range.type === type ? 'bg-plum text-white' : 'text-ink hover:bg-surface-2',
            )}
          >
            {type === 'mes' ? 'Mes' : type === 'trimestre' ? 'Trimestre' : 'Rango'}
          </button>
        ))}
      </div>

      {range.type === 'rango' ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="range-from">Desde</Label>
            <Input id="range-from" type="date" className="w-40" value={range.from}
              onChange={(event) => onChange(customRange(event.target.value, range.to))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="range-to">Hasta</Label>
            <Input id="range-to" type="date" className="w-40" value={range.to}
              onChange={(event) => onChange(customRange(range.from, event.target.value))} />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Periodo anterior"
            onClick={() => onChange(previousRange(range))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[170px] text-center font-heading text-[19px]">{range.label}</span>
          <Button variant="outline" size="icon" aria-label="Periodo siguiente"
            onClick={() => onChange(nextRange(range))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
