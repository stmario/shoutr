import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProfileIndexPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  redirect(`/profile/${user.username}`)
}
