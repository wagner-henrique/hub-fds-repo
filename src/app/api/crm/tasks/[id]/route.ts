import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { crmTaskSchema } from "@/lib/validations"

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
    const parsed = crmTaskSchema.parse(body)

    const updated = await prisma.crmTask.update({
      where: { id },
      data: {
        title: parsed.title,
        description: toOptional(parsed.description),
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        status: parsed.status,
        priority: parsed.priority,
        clientId: toOptional(parsed.clientId),
        dealId: toOptional(parsed.dealId),
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao atualizar tarefa" }, { status: 500 })
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

    await prisma.crmTask.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro ao excluir tarefa" }, { status: 500 })
  }
}
