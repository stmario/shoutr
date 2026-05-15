import { StakingPanel } from "@/components/staking/staking-panel"

export default function StakingPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Stake SHOT</h1>
        <p className="text-muted-foreground">
          Lock your tokens to earn platform benefits. Unstaking is available after the configured delay.
        </p>
      </div>

      <StakingPanel />
    </div>
  )
}
