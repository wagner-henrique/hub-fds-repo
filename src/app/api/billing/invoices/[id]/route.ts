import { BillingStatus, Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import { billingInvoiceSchema } from "@/lib/validations"

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
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true, email: true, cpf: true, cnpj: true, phone: true, address: true } } },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return NextResponse.json({ error: "Banco não atualizado para faturamento. Execute prisma db push." }, { status: 503 })
    }

    return NextResponse.json({ error: "Erro ao carregar fatura" }, { status: 500 })
  }
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
    const parsed = billingInvoiceSchema.parse(body)

    const paidAmount = parsed.paidAmount > parsed.total ? parsed.total : parsed.paidAmount
    const dueDate = new Date(parsed.dueDate)
    const status = toInvoiceStatus(parsed.status, paidAmount, parsed.total, dueDate)

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
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
        notes: toOptional(parsed.notes),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return NextResponse.json({ error: "Banco não atualizado para faturamento. Execute prisma db push." }, { status: 503 })
    }

    return NextResponse.json({ error: "Erro ao atualizar faturamento" }, { status: 500 })
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
    await prisma.invoice.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return NextResponse.json({ error: "Banco não atualizado para faturamento. Execute prisma db push." }, { status: 503 })
    }

    return NextResponse.json({ error: "Erro ao excluir faturamento" }, { status: 500 })
  }
}
