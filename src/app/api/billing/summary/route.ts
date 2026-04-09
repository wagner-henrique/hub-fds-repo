import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const now = new Date()

    const [openTotal, overdueTotal, receivedTotal, issuedCount] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { balance: true },
        where: { status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
      }),
      prisma.invoice.aggregate({
        _sum: { balance: true },
        where: { status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] }, dueDate: { lt: now } },
      }),
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { status: { in: ["PAID", "PARTIAL"] } },
      }),
      prisma.invoice.count({
        where: { status: { in: ["ISSUED", "PARTIAL", "PAID", "OVERDUE"] } },
      }),
    ])

    return NextResponse.json({
      openTotal: openTotal._sum.balance ?? 0,
      overdueTotal: overdueTotal._sum.balance ?? 0,
      receivedTotal: receivedTotal._sum.paidAmount ?? 0,
      issuedCount,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return NextResponse.json({
        openTotal: 0,
        overdueTotal: 0,
        receivedTotal: 0,
        issuedCount: 0,
        warning: "Estrutura de faturamento ainda não aplicada no banco. Execute prisma db push.",
      })
    }

    return NextResponse.json({ error: "Erro ao carregar resumo de faturamento" }, { status: 500 })
  }
}
