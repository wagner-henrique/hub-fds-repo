import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

export async function GET() {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const now = new Date()

    const [payablesOpen, receivablesOpen, payablesOverdue, receivablesOverdue, payablesPaid, receivablesPaid] = await Promise.all([
      prisma.financialEntry.aggregate({
        _sum: { amount: true },
        where: {
          type: "PAYABLE",
          status: { in: ["PENDING", "PARTIAL"] },
        },
      }),
      prisma.financialEntry.aggregate({
        _sum: { amount: true },
        where: {
          type: "RECEIVABLE",
          status: { in: ["PENDING", "PARTIAL"] },
        },
      }),
      prisma.financialEntry.aggregate({
        _sum: { amount: true },
        where: {
          type: "PAYABLE",
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { lt: now },
        },
      }),
      prisma.financialEntry.aggregate({
        _sum: { amount: true },
        where: {
          type: "RECEIVABLE",
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { lt: now },
        },
      }),
      prisma.financialEntry.aggregate({
        _sum: { amountPaid: true },
        where: {
          type: "PAYABLE",
          status: { in: ["PAID", "PARTIAL"] },
        },
      }),
      prisma.financialEntry.aggregate({
        _sum: { amountPaid: true },
        where: {
          type: "RECEIVABLE",
          status: { in: ["PAID", "PARTIAL"] },
        },
      }),
    ])

    return NextResponse.json({
      payablesOpen: payablesOpen._sum.amount ?? 0,
      receivablesOpen: receivablesOpen._sum.amount ?? 0,
      payablesOverdue: payablesOverdue._sum.amount ?? 0,
      receivablesOverdue: receivablesOverdue._sum.amount ?? 0,
      payablesPaid: payablesPaid._sum.amountPaid ?? 0,
      receivablesPaid: receivablesPaid._sum.amountPaid ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "Erro ao carregar resumo financeiro" }, { status: 500 })
  }
}
