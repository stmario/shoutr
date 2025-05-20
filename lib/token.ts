import { randomBytes } from "crypto"

// Generate a random token for email verification
export function generateToken(length = 32): string {
  return randomBytes(length).toString("hex")
}

// Calculate expiration time (24 hours from now)
export function getExpirationTime(): Date {
  const expirationTime = new Date()
  expirationTime.setHours(expirationTime.getHours() + 24)
  return expirationTime
}
