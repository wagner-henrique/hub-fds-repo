import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"

export async function requireSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return null
  }

  return session
}

export async function requireRole(roles: Array<"ADMIN" | "RECEPTION">) {
  const session = await requireSession()

  if (!session?.user?.role || !roles.includes(session.user.role)) {
    return null
  }

  return session
}