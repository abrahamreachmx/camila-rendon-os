import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Celda de texto editable en línea. Se ve como texto hasta que se hace clic.
 * Guarda al salir del campo o con Enter, cancela con Escape, y no llama a
 * onSave si el valor no cambió o quedó vacío.
 *
 * Detiene la propagación del clic porque las filas de DataTable navegan.
 */
export function EditableTextCell({
  value,
  onSave,
  label,
  className,
  disabled,
}: {
  value: string
  onSave: (next: string) => void
  /** Para el lector de pantalla, por ejemplo "Nombre de la campaña". */
  label: string
  className?: string
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    const next = draft.trim()
    setEditing(false)
    if (next === '' || next === value) {
      setDraft(value)
      return
    }
    onSave(next)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        aria-label={label}
        className={cn('h-8', className)}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') {
            setDraft(value)
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
        'max-w-full truncate rounded-sm px-1 py-0.5 text-left hover:bg-surface-2',
        'focus-visible:ring-2 focus-visible:ring-plum focus-visible:outline-none',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation()
        setEditing(true)
      }}
    >
      {value}
    </button>
  )
}
