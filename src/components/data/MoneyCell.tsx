import { formatMoney, type Currency } from '@/lib/money'
import { cn } from '@/lib/utils'

export function MoneyCell({
  amount,
  currency = 'MXN',
  className,
  strong,
}: {
  amount: number | string | null | undefined
  currency?: Currency
  className?: string
  strong?: boolean
}) {
  const value = Number(amount ?? 0)
  return (
    <span className={cn('tabular-nums', strong && 'font-semibold', className)}>
      {formatMoney(value, currency)}
    </span>
  )
}
