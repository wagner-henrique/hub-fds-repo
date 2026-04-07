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
      select: {
        type: true,
        fileData: true,
        fileName: true,
        mimeType: true,
      },
    })

    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 })
    }

    if (!contract.fileData) {
      return NextResponse.json({ error: "Este contrato não possui PDF anexado" }, { status: 400 })
    }

    const fileName = contract.fileName || `contrato-${id}.pdf`

    return new NextResponse(contract.fileData, {
      headers: {
        "Content-Type": contract.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao abrir arquivo do contrato" }, { status: 500 })
  }
}
