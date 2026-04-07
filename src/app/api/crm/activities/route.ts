import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { crmActivitySchema, paginationSchema } from "@/lib/validations"

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
    const clientId = searchParams.get("clientId")
    const dealId = searchParams.get("dealId")

    const where = {
      ...(clientId ? { clientId } : {}),
      ...(dealId ? { dealId } : {}),
    }

    const skip = (page - 1) * limit

    const [activities, total] = await Promise.all([
      prisma.crmActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      prisma.crmActivity.count({ where }),
    ])

    return NextResponse.json({
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar interações" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = crmActivitySchema.parse(body)

    const created = await prisma.crmActivity.create({
      data: {
        type: parsed.type,
        content: parsed.content,
        clientId: toOptional(parsed.clientId),
        dealId: toOptional(parsed.dealId),
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao registrar interação" }, { status: 500 })
  }
}
