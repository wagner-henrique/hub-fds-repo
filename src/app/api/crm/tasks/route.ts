import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { crmTaskSchema, paginationSchema } from "@/lib/validations"

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
    const status = searchParams.get("status")

    const where: Prisma.CrmTaskWhereInput = {
      ...(status ? { status: status as any } : {}),
    }

    const skip = (page - 1) * limit

    const [tasks, total] = await Promise.all([
      prisma.crmTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          client: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      prisma.crmTask.count({ where }),
    ])

    return NextResponse.json({
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar tarefas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = crmTaskSchema.parse(body)

    const created = await prisma.crmTask.create({
      data: {
        title: parsed.title,
        description: toOptional(parsed.description),
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        status: parsed.status,
        priority: parsed.priority,
        clientId: toOptional(parsed.clientId),
        dealId: toOptional(parsed.dealId),
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao criar tarefa" }, { status: 500 })
  }
}
