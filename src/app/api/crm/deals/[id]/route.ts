import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { crmDealSchema } from "@/lib/validations"

const toOptional = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = crmDealSchema.parse(body)

    const updated = await prisma.crmDeal.update({
      where: { id },
      data: {
        title: parsed.title,
        description: toOptional(parsed.description),
        value: parsed.value,
        stage: parsed.stage,
        expectedCloseDate: parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null,
        source: toOptional(parsed.source),
        clientId: parsed.clientId,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao atualizar negócio" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    await prisma.crmDeal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro ao excluir negócio" }, { status: 500 })
  }
}
