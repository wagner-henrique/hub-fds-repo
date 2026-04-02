import { redirect } from "next/navigation"

import { requireRole } from "@/lib/auth-guards"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRole(["ADMIN", "RECEPTION"])

  if (!session) {
    redirect("/login?callbackUrl=/admin")
  }

  return children
}