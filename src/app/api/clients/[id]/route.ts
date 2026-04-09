import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { clientSchema } from "@/lib/validations"

const mapZodIssues = (issues: Array<{ path?: Array<string | number>; message?: string }>) => {
  return issues.map((issue) => ({
    field: issue.path?.length ? String(issue.path[0]) : "form",
    message: issue.message || "Valor inválido",
  }))
}

const normalizeOptional = (value?: string | null) => {
  if (!value) return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
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
    const parsed = clientSchema.parse(body)

    const previous = await prisma.client.findUnique({ where: { id } })
    if (!previous) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name: parsed.name,
        type: parsed.type,
        email: parsed.email,
        phone: parsed.phone,
        whatsapp: normalizeOptional(parsed.whatsapp),
        cpf: normalizeOptional(parsed.cpf),
        cnpj: normalizeOptional(parsed.cnpj),
        birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
        address: normalizeOptional(parsed.address),
        notes: normalizeOptional(parsed.notes),
      },
    })

    if (previous.email !== updated.email) {
      await prisma.booking.updateMany({
        where: { clientId: id, email: previous.email },
        data: { clientId: null },
      })
    }

    await prisma.booking.updateMany({
      where: { email: updated.email },
      data: { clientId: id },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.name === "ZodError") {
      const details = mapZodIssues(error.errors || [])
      const firstMessage = details[0]?.message || "Falha de validação"
      return NextResponse.json({ error: firstMessage, details }, { status: 400 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "E-mail, telefone, CPF ou CNPJ já cadastrado" }, { status: 409 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return NextResponse.json({ error: "Banco não atualizado para clientes. Execute prisma db push." }, { status: 503 })
    }

    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
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

    await prisma.booking.updateMany({
      where: { clientId: id },
      data: { clientId: null },
    })

    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return NextResponse.json({ error: "Banco não atualizado para clientes. Execute prisma db push." }, { status: 503 })
    }

    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
