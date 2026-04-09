import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { financialEntrySchema } from "@/lib/validations"

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
    const parsed = financialEntrySchema.parse(body)

    const amountPaid = parsed.amountPaid > parsed.amount ? parsed.amount : parsed.amountPaid
    const status = parsed.status === "PENDING" && amountPaid > 0
      ? (amountPaid >= parsed.amount ? "PAID" : "PARTIAL")
      : parsed.status

    const updated = await prisma.financialEntry.update({
      where: { id },
      data: {
        type: parsed.type,
        status,
        title: parsed.title,
        description: toOptional(parsed.description),
        category: toOptional(parsed.category),
        amount: parsed.amount,
        amountPaid,
        dueDate: new Date(parsed.dueDate),
        paymentDate: parsed.paymentDate ? new Date(parsed.paymentDate) : null,
        referenceCode: toOptional(parsed.referenceCode),
        clientId: toOptional(parsed.clientId),
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao atualizar lançamento" }, { status: 500 })
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

    await prisma.financialEntry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro ao excluir lançamento" }, { status: 500 })
  }
}
