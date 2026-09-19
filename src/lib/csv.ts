import { triggerDownload } from '@/lib/download'

/** BOM UTF-8: sin esto Excel en Windows abre "Campaña" como "CampaÃ±a". */
const BOM = '﻿'

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export type CsvColumn<T> = { header: string; value: (row: T) => unknown }

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const head = columns.map((column) => escapeCell(column.header)).join(',')
  const body = rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(','))
  return BOM + [head, ...body].join('\r\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, filename)
}
