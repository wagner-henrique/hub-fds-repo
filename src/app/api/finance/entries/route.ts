import { NextResponse } from "next/server"
import { FinancialEntryStatus, FinancialEntryType, Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole, requireSession } from "@/lib/auth-guards"
import { financialEntrySchema, paginationSchema } from "@/lib/validations"

const toOptional = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const { page, limit } = paginationSchema.parse(queryParams)

    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const period = searchParams.get("period")

    const periodDays = Number(period)
    const hasPeriod = Number.isFinite(periodDays) && periodDays > 0
    const periodStart = hasPeriod
      ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      : null

    const where: Prisma.FinancialEntryWhereInput = {
      ...(type && ["PAYABLE", "RECEIVABLE"].includes(type) ? { type: type as FinancialEntryType } : {}),
      ...(status && ["PENDING", "PARTIAL", "PAID", "CANCELED"].includes(status) ? { status: status as FinancialEntryStatus } : {}),
      ...(periodStart ? { dueDate: { gte: periodStart } } : {}),
    }

    const skip = (page - 1) * limit

    const [entries, total] = await Promise.all([
      prisma.financialEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.financialEntry.count({ where }),
    ])

    return NextResponse.json({
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar lançamentos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const currentSession = await requireSession()
    const createdBy = currentSession?.user?.email || null

    const body = await request.json()
    const parsed = financialEntrySchema.parse(body)

    const amountPaid = parsed.amountPaid > parsed.amount ? parsed.amount : parsed.amountPaid
    const status = parsed.status === "PENDING" && amountPaid > 0
      ? (amountPaid >= parsed.amount ? "PAID" : "PARTIAL")
      : parsed.status

    const created = await prisma.financialEntry.create({
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
        createdBy,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao criar lançamento" }, { status: 500 })
  }
}