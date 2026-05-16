import type { ReactNode } from "react"
import { METAMASK_DOWNLOAD_URL } from "@/lib/ethereum-wallet"

type MetamaskInstallLinkProps = {
  className?: string
  children?: ReactNode
}

export function MetamaskInstallLink({
  className,
  children = "Download MetaMask",
}: MetamaskInstallLinkProps) {
  return (
    <a
      href={METAMASK_DOWNLOAD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "font-medium text-purple-600 underline underline-offset-2 hover:text-purple-700 dark:text-purple-400"
      }
    >
      {children}
    </a>
  )
}

type MetamaskInstallPromptProps = {
  className?: string
}

export function MetamaskInstallPrompt({ className }: MetamaskInstallPromptProps) {
  return (
    <p className={className ?? "text-sm text-muted-foreground"}>
      MetaMask is not installed.{" "}
      <MetamaskInstallLink />
    </p>
  )
}
