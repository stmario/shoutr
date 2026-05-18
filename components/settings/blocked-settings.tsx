import { listBlockedUsers } from "@/app/actions/block-actions"
import { BlockedAccountsList } from "@/components/settings/blocked-accounts-list"

export async function BlockedSettings() {
  const blocked = await listBlockedUsers()
  return <BlockedAccountsList blocked={blocked} />
}
