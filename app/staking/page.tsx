import { StakingPanel } from "@/components/staking/staking-panel"
import { ShotTokenLogo } from "@/components/shot-token-logo"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function StakingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <ShotTokenLogo size={64} />
        </div>
        <h1 className="text-4xl font-bold mb-2">Stake SHOT</h1>
        <p className="text-muted-foreground">
          Lock your tokens to earn platform benefits. Unstaking is available after the configured delay.
        </p>
      </div>

      <StakingPanel />
    </div>
  )
}
