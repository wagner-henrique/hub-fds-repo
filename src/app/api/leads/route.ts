import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { leadSchema, paginationSchema } from '@/lib/validations'
import { LeadStatus } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const { page, limit } = paginationSchema.parse(queryParams)

    const skip = (page - 1) * limit

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count(),
    ])

    return NextResponse.json({
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = leadSchema.parse(body)

    const existingLead = await prisma.lead.findFirst({
      where: { email: validatedData.email },
      orderBy: { createdAt: 'desc' }
    })

    let lead

    if (existingLead) {
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name: validatedData.name ?? existingLead.name,
          phone: validatedData.phone ?? existingLead.phone,
          source: validatedData.source,
          updatedAt: new Date(),
        },
      })
    } else {
      lead = await prisma.lead.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          source: validatedData.source,
          status: LeadStatus.NEW
        },
      })
    }

    return NextResponse.json(lead, { status: existingLead ? 200 : 201 })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao salvar lead" }, { status: 500 })
  }
}