"use server"

import { getCurrentUser, logout } from "@/lib/auth"

export { getCurrentUser }

export async function signOut() {
  return logout()
}
