import { formatLikeWeightShot, weightWeiToBigInt } from "@/lib/like-weight"

/** Minimum staked SHOT (wei) required to moderate-delete others' shouts. */
export const MIN_MODERATOR_SHOT_WEI = 10_000n * 10n ** 18n

export const MIN_DELETE_REASON_LENGTH = 10
export const MAX_DELETE_REASON_LENGTH = 500

export function canModerateDeleteByStake(
  deleterWeightWei: string | number | bigint | null | undefined,
  authorWeightWei: string | number | bigint | null | undefined,
): boolean {
  const deleter = weightWeiToBigInt(deleterWeightWei)
  const author = weightWeiToBigInt(authorWeightWei)

  if (deleter < MIN_MODERATOR_SHOT_WEI) return false
  return deleter > author
}

export function formatModeratorShotThreshold(): string {
  return formatLikeWeightShot(MIN_MODERATOR_SHOT_WEI)
}

export function validateDeleteReason(reason: string): { ok: true; value: string } | { ok: false; message: string } {
  const trimmed = reason.trim()
  if (trimmed.length < MIN_DELETE_REASON_LENGTH) {
    return {
      ok: false,
      message: `Please provide a reason (at least ${MIN_DELETE_REASON_LENGTH} characters).`,
    }
  }
  if (trimmed.length > MAX_DELETE_REASON_LENGTH) {
    return {
      ok: false,
      message: `Reason must be at most ${MAX_DELETE_REASON_LENGTH} characters.`,
    }
  }
  return { ok: true, value: trimmed }
}
