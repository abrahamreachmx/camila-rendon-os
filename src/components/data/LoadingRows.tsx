import { Skeleton } from '@/components/ui/skeleton'

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-line bg-surface p-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  )
}
