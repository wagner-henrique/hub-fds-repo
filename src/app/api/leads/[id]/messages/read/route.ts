import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const now = new Date()

    await prisma.leadMessage.updateMany({
      where: {
        leadId: id,
        sender: "CUSTOMER",
        readAt: null,
      },
      data: {
        readAt: now,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro ao marcar mensagens como lidas" }, { status: 500 })
  }
}
