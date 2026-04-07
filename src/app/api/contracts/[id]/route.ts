import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, email: true, cpf: true, cnpj: true },
        },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ...contract,
      fileData: undefined,
      hasFile: Boolean(contract.fileData),
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar contrato" }, { status: 500 })
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

    await prisma.contract.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro ao excluir contrato" }, { status: 500 })
  }
}
