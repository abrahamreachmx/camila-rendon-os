import { EmptyState } from '@/components/data/EmptyState'
import type { CampaignWithRelations } from '@/types'

export function CampaignQuoteTab(_props: { campaign: CampaignWithRelations; onSaved: () => void }) {
  return <EmptyState message="Cotización: en construcción." />
}
