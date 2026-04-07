import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { crmDealSchema, paginationSchema } from "@/lib/validations"

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
    const stage = searchParams.get("stage")
    const search = searchParams.get("search")?.trim()

    const where: Prisma.CrmDealWhereInput = {
      ...(stage ? { stage: stage as any } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { source: { contains: search, mode: "insensitive" } },
              { client: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    }

    const skip = (page - 1) * limit

    const [deals, total] = await Promise.all([
      prisma.crmDeal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tasks: true, activities: true },
          },
        },
      }),
      prisma.crmDeal.count({ where }),
    ])

    return NextResponse.json({
      data: deals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar negócios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = crmDealSchema.parse(body)

    const created = await prisma.crmDeal.create({
      data: {
        title: parsed.title,
        description: toOptional(parsed.description),
        value: parsed.value,
        stage: parsed.stage,
        expectedCloseDate: parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null,
        source: toOptional(parsed.source),
        clientId: parsed.clientId,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao criar negócio" }, { status: 500 })
  }
}
