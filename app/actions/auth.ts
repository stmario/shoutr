"use server"

import { redirect } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"

export { getCurrentUser }

/** Clear session cookie only (no navigation). Use before picking another wallet on /login. */
export async function clearAuthSession() {
  await logout()
}

export async function signOut() {
  await clearAuthSession()
  redirect("/login")
}
