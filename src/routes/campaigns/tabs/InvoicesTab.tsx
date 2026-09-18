import { EmptyState } from '@/components/data/EmptyState'
import type { CampaignWithRelations } from '@/types'

export function CampaignInvoicesTab(_props: { campaign: CampaignWithRelations; onSaved: () => void }) {
  return <EmptyState message="Facturas: en construcción." />
}
