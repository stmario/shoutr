"use client"

import { useCallback, useEffect, useState } from "react"
import { ethers, BrowserProvider } from "ethers"
import { AlertCircle, Clock, Loader2, Lock, Unlock, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { refreshMyLikePower } from "@/app/actions/vote-actions"
import {
  approveStaking,
  connectWallet,
  formatStakeError,
  getConnectedAddress,
  getStakeInfo,
  getStakingContractAddress,
  stakeTokens,
  unstakeTokens,
  type StakeInfo,
} from "@/lib/staking-contract"

function formatUnits(value: bigint, decimals: number, maxFraction = 4) {
  const formatted = ethers.formatUnits(value, decimals)
  const n = Number.parseFloat(formatted)
  if (!Number.isFinite(n)) return formatted
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFraction })
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return "Unlocked"
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)
  return parts.join(" ")
}

function formatUnlockDate(unlockTime: bigint) {
  if (unlockTime === 0n) return "—"
  return new Date(Number(unlockTime) * 1000).toLocaleString()
}

function getExplorerTxUrl(txHash: string) {
  const chainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1", 10)
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${txHash}`
  if (chainId === 1) return `https://etherscan.io/tx/${txHash}`
  return `https://etherscan.io/tx/${txHash}`
}

export function StakingPanel() {
  const contractConfigured = Boolean(getStakingContractAddress())
  const [address, setAddress] = useState<string | null>(null)
  const [info, setInfo] = useState<StakeInfo | null>(null)
  const [amount, setAmount] = useState("")
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const refresh = useCallback(async (wallet: string | null) => {
    if (!wallet || !contractConfigured) {
      setInfo(null)
      setIsLoading(false)
      return
    }

    try {
      const stakeInfo = await getStakeInfo(wallet)
      setInfo(stakeInfo)
    } catch (err) {
      console.error(err)
      setError(formatStakeError(err))
    } finally {
      setIsLoading(false)
    }
  }, [contractConfigured])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const connected = await getConnectedAddress()
      if (!cancelled) {
        setAddress(connected)
        await refresh(connected)
      }
    }

    init()

    if (typeof window !== "undefined" && window.ethereum) {
      const onAccounts = (accounts: string[]) => {
        const next = accounts[0] ?? null
        setAddress(next)
        setIsLoading(true)
        void refresh(next)
      }
      window.ethereum.on?.("accountsChanged", onAccounts)
      return () => {
        cancelled = true
        window.ethereum?.removeListener?.("accountsChanged", onAccounts)
      }
    }

    return () => {
      cancelled = true
    }
  }, [refresh])

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  const ensureCorrectChain = async () => {
    if (!window.ethereum) return false
    const chainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1", 10)
    const provider = new BrowserProvider(window.ethereum)
    const network = await provider.getNetwork()
    if (Number(network.chainId) === chainId) return true

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
      return true
    } catch {
      setError(`Switch your wallet to chain ID ${chainId} (NEXT_PUBLIC_CHAIN_ID).`)
      return false
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    const ok = await ensureCorrectChain()
    if (!ok) {
      setIsConnecting(false)
      return
    }
    const result = await connectWallet()
    if (result.success) {
      setAddress(result.address)
      setIsLoading(true)
      await refresh(result.address)
    } else {
      setError(formatStakeError(result.error))
    }
    setIsConnecting(false)
  }

  const handleStake = async () => {
    if (!address || !info) return
    setError(null)
    setSuccess(null)
    setTxHash(null)
    setIsSubmitting(true)

    try {
      if (!(await ensureCorrectChain())) return

      const parsed = ethers.parseUnits(amount || "0", info.tokenDecimals)
      if (parsed <= 0n) {
        setError("Enter a valid stake amount.")
        return
      }
      if (parsed > info.walletBalance) {
        setError("Amount exceeds your wallet balance.")
        return
      }

      if (info.allowance < parsed) {
        const approveResult = await approveStaking(parsed, address)
        if (!approveResult.success) {
          setError(formatStakeError(approveResult.error))
          return
        }
      }

      const stakeResult = await stakeTokens(parsed, address)
      if (!stakeResult.success) {
        setError(formatStakeError(stakeResult.error))
        return
      }

      setSuccess(`Staked ${amount} ${info.tokenSymbol}.`)
      setTxHash(stakeResult.txHash)
      setAmount("")
      setIsLoading(true)
      await refresh(address)
      await refreshMyLikePower()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnstake = async () => {
    if (!address) return
    setError(null)
    setSuccess(null)
    setTxHash(null)
    setIsSubmitting(true)

    try {
      if (!(await ensureCorrectChain())) return

      const result = await unstakeTokens(address)
      if (!result.success) {
        setError(formatStakeError(result.error))
        return
      }

      setSuccess("Successfully unstaked your tokens.")
      setTxHash(result.txHash)
      setIsLoading(true)
      await refresh(address)
      await refreshMyLikePower()
    } finally {
      setIsSubmitting(false)
    }
  }

  const stakedAmount = info?.amount ?? 0n
  const unlockTime = info?.unlockTime ?? 0n
  const secondsUntilUnlock = Number(unlockTime) - now
  const isLocked = stakedAmount > 0n && secondsUntilUnlock > 0
  const canUnstake = stakedAmount > 0n && !isLocked
  const unstakeDelaySec = info ? Number(info.unstakeDelay) : 0
  const lockProgress =
    stakedAmount > 0n && unstakeDelaySec > 0 && isLocked
      ? Math.min(100, Math.max(0, ((unstakeDelaySec - secondsUntilUnlock) / unstakeDelaySec) * 100))
      : canUnstake
        ? 100
        : 0

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

  if (!contractConfigured) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Set <code className="text-xs">NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS</code> in your environment to enable
          staking.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your stake</CardTitle>
          <CardDescription>
            {info
              ? `Stake ${info.tokenSymbol} to support the network. Unstaking is available after the lock period.`
              : "Connect your wallet to view your position."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!address ? (
            <Button onClick={handleConnect} disabled={isConnecting} className="w-full gap-2">
              <Wallet className="h-4 w-4" />
              {isConnecting ? "Connecting…" : "Connect wallet"}
            </Button>
          ) : (
            <div className="flex items-center justify-between rounded-md bg-muted p-3 text-sm">
              <span className="font-medium">{formatAddress(address)}</span>
              <Button variant="ghost" size="sm" onClick={() => void refresh(address)} disabled={isLoading}>
                Refresh
              </Button>
            </div>
          )}

          {isLoading && address ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : info && address ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet balance</p>
                  <p className="text-lg font-semibold">
                    {formatUnits(info.walletBalance, info.tokenDecimals)} {info.tokenSymbol}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Staked</p>
                  <p className="text-lg font-semibold">
                    {formatUnits(stakedAmount, info.tokenDecimals)} {info.tokenSymbol}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    Lock progress
                  </span>
                  <span className="font-medium">
                    {stakedAmount === 0n
                      ? "No active stake"
                      : isLocked
                        ? formatDuration(secondsUntilUnlock)
                        : "Ready to unstake"}
                  </span>
                </div>
                <Progress value={lockProgress} />
                {stakedAmount > 0n && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Unlocks {formatUnlockDate(unlockTime)}
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Unstake delay: {formatDuration(unstakeDelaySec)} (resets on each stake)
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stake & unstake</CardTitle>
          <CardDescription>Approve the staking contract once, then deposit tokens.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="stake-amount">Amount to stake</Label>
            <div className="flex gap-2">
              <Input
                id="stake-amount"
                type="number"
                min="0"
                step="any"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!address || isSubmitting}
              />
              {info && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!address || isSubmitting}
                  onClick={() => setAmount(ethers.formatUnits(info.walletBalance, info.tokenDecimals))}
                >
                  Max
                </Button>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handleStake} disabled={!address || !info || isSubmitting || isLoading}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirm in wallet…
              </>
            ) : (
              "Stake tokens"
            )}
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleUnstake}
            disabled={!address || !canUnstake || isSubmitting || isLoading}
          >
            {isLocked ? `Locked (${formatDuration(secondsUntilUnlock)} left)` : "Unstake all"}
          </Button>

          {txHash && (
            <p className="text-center text-xs text-muted-foreground">
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                View transaction
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}