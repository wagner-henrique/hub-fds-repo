import { BillingStatus, Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { requireRole, requireSession } from "@/lib/auth-guards"
import { generateInvoicePaymentCodes } from "@/lib/mercadopago"
import { prisma } from "@/lib/prisma"
import { billingInvoiceSchema, paginationSchema } from "@/lib/validations"

const mapZodIssues = (issues: Array<{ path?: Array<string | number>; message?: string }>) => {
  return issues.map((issue) => ({
    field: issue.path?.length ? String(issue.path[0]) : "form",
    message: issue.message || "Valor inválido",
  }))
}

const toOptional = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const toInvoiceStatus = (status: string, paidAmount: number, total: number, dueDate: Date): BillingStatus => {
  if (status === "CANCELED") return "CANCELED"
  if (paidAmount >= total && total > 0) return "PAID"
  if (paidAmount > 0 && paidAmount < total) return "PARTIAL"
  if (status === "DRAFT") return "DRAFT"

  const isOverdue = dueDate.getTime() < Date.now()
  return isOverdue ? "OVERDUE" : "ISSUED"
}

const getNextInvoiceNumber = async () => {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const prefix = `FAT-${y}${m}`

  const latest = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  })

  const next = latest?.number ? Number(latest.number.split("-").pop()) + 1 : 1
  return `${prefix}-${String(next).padStart(4, "0")}`
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

    const status = searchParams.get("status")
    const period = searchParams.get("period")
    const search = searchParams.get("search")?.trim()

    const periodDays = Number(period)
    const hasPeriod = Number.isFinite(periodDays) && periodDays > 0
    const periodStart = hasPeriod
      ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      : null

    const where: Prisma.InvoiceWhereInput = {
      ...(status && ["DRAFT", "ISSUED", "PARTIAL", "PAID", "CANCELED", "OVERDUE"].includes(status)
        ? { status: status as BillingStatus }
        : {}),
      ...(periodStart ? { issueDate: { gte: periodStart } } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              { referenceCode: { contains: search, mode: "insensitive" } },
              { pixCode: { contains: search, mode: "insensitive" } },
              { barcode: { contains: search, mode: "insensitive" } },
              { client: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    }

    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: { client: { select: { id: true, name: true, email: true } } },
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 100,
          totalPages: 0,
        },
        warning: "Estrutura de faturamento ainda não aplicada no banco. Execute prisma db push.",
      })
    }

    return NextResponse.json({ error: "Erro ao buscar faturamentos" }, { status: 500 })
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
    const parsed = billingInvoiceSchema.parse(body)

    const paidAmount = parsed.paidAmount > parsed.total ? parsed.total : parsed.paidAmount
    const dueDate = new Date(parsed.dueDate)
    const status = toInvoiceStatus(parsed.status, paidAmount, parsed.total, dueDate)
    const number = await getNextInvoiceNumber()

    const client = await prisma.client.findUnique({
      where: { id: parsed.clientId },
      select: { name: true, email: true, cpf: true, cnpj: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    let pixCode = toOptional(parsed.pixCode)
    let barcode = toOptional(parsed.barcode)

    if ((!pixCode || !barcode) && parsed.total > 0) {
      try {
        const [firstName, ...rest] = (client.name || "").trim().split(" ")
        const generated = await generateInvoicePaymentCodes({
          amount: parsed.total,
          description: parsed.title,
          externalReference: number,
          payerEmail: client.email,
          payerFirstName: firstName || null,
          payerLastName: rest.join(" ") || null,
          payerDocumentType: client.cnpj ? "CNPJ" : "CPF",
          payerDocumentNumber: client.cnpj || client.cpf || null,
          paymentMethodHint: parsed.paymentMethod || null,
        })

        pixCode = pixCode || generated.pixCode
        barcode = barcode || generated.barcode
      } catch {
        // Mantém fluxo sem bloquear faturamento se o gateway falhar.
      }
    }

    const created = await prisma.invoice.create({
      data: {
        number,
        status,
        title: parsed.title,
        clientId: parsed.clientId,
        issueDate: new Date(parsed.issueDate),
        dueDate,
        servicePeriodStart: parsed.servicePeriodStart ? new Date(parsed.servicePeriodStart) : null,
        servicePeriodEnd: parsed.servicePeriodEnd ? new Date(parsed.servicePeriodEnd) : null,
        items: parsed.items as unknown as Prisma.InputJsonValue,
        subtotal: parsed.subtotal,
        discount: parsed.discount,
        tax: parsed.tax,
        total: parsed.total,
        paidAmount,
        balance: Math.max(parsed.total - paidAmount, 0),
        paymentMethod: toOptional(parsed.paymentMethod),
        referenceCode: toOptional(parsed.referenceCode),
        pixCode,
        barcode,
        notes: toOptional(parsed.notes),
        createdBy,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      const details = mapZodIssues(error.errors || [])
      const firstMessage = details[0]?.message || "Falha de validação"
      return NextResponse.json({ error: firstMessage, details }, { status: 400 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return NextResponse.json({ error: "Banco não atualizado para faturamento. Execute prisma db push." }, { status: 503 })
    }

    return NextResponse.json({ error: "Erro ao criar faturamento" }, { status: 500 })
  }
}
