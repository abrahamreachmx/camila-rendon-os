import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Devuelve el valor por el que se ordena. Sin esto la columna no es ordenable. */
  sortValue?: (row: T) => string | number | null
  align?: 'left' | 'right'
  /** Columnas secundarias: se ocultan abajo de 768 px. */
  hideOnMobile?: boolean
  width?: string
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  emptyState,
  initialSort,
}: {
  rows: readonly T[]
  columns: readonly Column<T>[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
  initialSort?: { key: string; direction: 'asc' | 'desc' }
}) {
  const [sort, setSort] = useState<SortState>(initialSort ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((c) => c.key === sort.key)
    if (!column?.sortValue) return rows
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a)
      const bv = column.sortValue!(b)
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv), 'es') * factor
    })
  }, [rows, columns, sort])

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  if (rows.length === 0 && emptyState) return <>{emptyState}</>

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="bg-surface-2">
            {columns.map((column) => {
              const sortable = Boolean(column.sortValue)
              const active = sort?.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sortable
                      ? active
                        ? sort!.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-3 py-2.5 text-[13px] font-semibold text-ink',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.hideOnMobile && 'hidden md:table-cell',
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-sm hover:text-plum',
                        column.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      {column.header}
                      {active ? (
                        sort!.direction === 'asc' ? (
                          <ChevronUp className="size-3.5" aria-hidden />
                        ) : (
                          <ChevronDown className="size-3.5" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-40" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={getRowId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-t border-line',
                onRowClick && 'cursor-pointer hover:bg-surface-2',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-3 py-2.5 align-middle',
                    column.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                    column.hideOnMobile && 'hidden md:table-cell',
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
