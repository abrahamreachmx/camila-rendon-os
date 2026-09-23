import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { formatMoney, parseMoney, round2, type Currency } from '@/lib/money'
import { cn } from '@/lib/utils'

/**
 * Monto editable en línea. Se ve formateado y se edita en crudo.
 *
 * Hermano de EditableTextCell, con dos diferencias que importan para dinero:
 * cero es un valor legítimo, y lo escrito se lee con parseMoney, que tolera
 * comas, puntos y símbolos. Rechaza lo que no sea un número o sea negativo.
 */
export function EditableMoneyCell({
  value,
  currency = 'MXN',
  onSave,
  label,
  className,
  disabled,
}: {
  value: number
  currency?: Currency
  onSave: (next: number) => void
  /** Para el lector de pantalla, por ejemplo "Tarifa de Reel". */
  label: string
  className?: string
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(String(value))
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed === '') {
      setDraft(String(value))
      return
    }
    const next = parseMoney(trimmed)
    if (!Number.isFinite(next) || next < 0 || next === round2(value)) {
      setDraft(String(value))
      return
    }
    onSave(next)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        inputMode="decimal"
        aria-label={label}
        className={cn('h-8 text-right tabular-nums', className)}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') {
            setDraft(String(value))
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${label}. Clic para editar.`}
      className={cn(
        'rounded-sm px-1 py-0.5 text-right tabular-nums hover:bg-surface-2',
        'focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation()
        setEditing(true)
      }}
    >
      {formatMoney(value, currency)}
    </button>
  )
}
