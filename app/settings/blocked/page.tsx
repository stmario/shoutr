import { redirect } from "next/navigation"

/** Legacy route — blocked list lives on the main settings page. */
export default function BlockedAccountsSettingsPage() {
  redirect("/settings?tab=blocked")
}
