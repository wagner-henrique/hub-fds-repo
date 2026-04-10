import { NextResponse } from "next/server"
import { LeadAiStatus } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

const updateAiStatusSchema = z.object({
  aiStatus: z.nativeEnum(LeadAiStatus),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const payload = updateAiStatusSchema.parse(body)

    const isPaused = payload.aiStatus === LeadAiStatus.PAUSED

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        aiStatus: payload.aiStatus,
        aiPausedAt: isPaused ? new Date() : null,
        aiPausedBy: isPaused ? (session.user?.email || "atendente") : null,
      },
    })

    await prisma.leadMessage.create({
      data: {
        leadId: id,
        sender: "SYSTEM",
        type: "EVENT",
        readAt: new Date(),
        content: isPaused
          ? "Atendimento transferido para humano (IA pausada)."
          : "Atendimento automático retomado (IA ativa).",
        metadata: {
          changedBy: session.user?.email || null,
        },
      },
    })

    return NextResponse.json({ data: lead })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao atualizar status da IA" }, { status: 500 })
  }
}
