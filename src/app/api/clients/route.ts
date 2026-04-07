import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { clientSchema, paginationSchema } from "@/lib/validations"

const normalizeOptional = (value?: string | null) => {
  if (!value) return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
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
    const search = searchParams.get("search")?.trim()

    const skip = (page - 1) * limit

    const where: Prisma.ClientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { whatsapp: { contains: search, mode: "insensitive" } },
            { cpf: { contains: search, mode: "insensitive" } },
            { cnpj: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = clientSchema.parse(body)

    const created = await prisma.client.create({
      data: {
        name: parsed.name,
        type: parsed.type,
        email: parsed.email,
        phone: parsed.phone,
        whatsapp: normalizeOptional(parsed.whatsapp),
        cpf: normalizeOptional(parsed.cpf),
        cnpj: normalizeOptional(parsed.cnpj),
        birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
        address: normalizeOptional(parsed.address),
        notes: normalizeOptional(parsed.notes),
      },
    })

    await prisma.booking.updateMany({
      where: { email: created.email },
      data: { clientId: created.id },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "E-mail, telefone, CPF ou CNPJ já cadastrado" }, { status: 409 })
    }

    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 })
  }
}
