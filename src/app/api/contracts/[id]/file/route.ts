import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

function sanitizeFileName(fileName: string, fallbackName: string): string {
  const base = fileName
    .replace(/[\r\n"]/g, "")
    .replace(/[^a-zA-Z0-9._\-() ]/g, "_")
    .trim()

  const safe = base || fallbackName
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`
}

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

    const fallbackName = `contrato-${id}.pdf`
    const fileName = sanitizeFileName(contract.fileName || fallbackName, fallbackName)
    const encodedFileName = encodeURIComponent(fileName)

    return new NextResponse(contract.fileData, {
      headers: {
        "Content-Type": contract.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao abrir arquivo do contrato" }, { status: 500 })
  }
}
