import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { leadSchema, paginationSchema } from '@/lib/validations'
import { LeadAiStatus, LeadStatus } from '@prisma/client'
import { requireRole } from '@/lib/auth-guards'
import { Prisma } from '@prisma/client'
import { applyRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const { page, limit } = paginationSchema.parse(queryParams)
    const search = (searchParams.get('search') || '').trim()
    const aiStatusFilter = (searchParams.get('aiStatus') || 'ALL').toUpperCase()
    const unreadFilter = (searchParams.get('unread') || 'ALL').toUpperCase()
    const interactionFilter = (searchParams.get('interaction') || 'ALL').toUpperCase()

    const skip = (page - 1) * limit
    const now = new Date()

    let interactionDate: Date | null = null
    if (interactionFilter === '24H') {
      interactionDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    } else if (interactionFilter === '7D') {
      interactionDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (interactionFilter === '30D') {
      interactionDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const andFilters: Prisma.LeadWhereInput[] = []

    if (search) {
      andFilters.push({
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { whatsappPhone: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      })
    }

    if (aiStatusFilter !== 'ALL' && (aiStatusFilter === LeadAiStatus.ACTIVE || aiStatusFilter === LeadAiStatus.PAUSED)) {
      andFilters.push({ aiStatus: aiStatusFilter as LeadAiStatus })
    }

    if (unreadFilter === 'UNREAD') {
      andFilters.push({ messages: { some: { sender: 'CUSTOMER', readAt: null } as any } })
    }

    if (unreadFilter === 'READ') {
      andFilters.push({ messages: { none: { sender: 'CUSTOMER', readAt: null } as any } })
    }

    if (interactionDate) {
      andFilters.push({ lastMessageAt: { gte: interactionDate } })
    }

    const where: Prisma.LeadWhereInput = {
      AND: andFilters,
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { lastMessageAt: 'desc' },
          { updatedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ])

    const leadIds = leads.map((lead) => lead.id)
    const unreadByLead = leadIds.length
      ? await prisma.leadMessage.groupBy({
          by: ['leadId'],
          where: {
            leadId: { in: leadIds },
            sender: 'CUSTOMER',
            readAt: null,
          },
          _count: {
            _all: true,
          },
        })
      : []

    const unreadMap = unreadByLead.reduce<Record<string, number>>((acc, item) => {
      acc[item.leadId] = item._count._all
      return acc
    }, {})

    const leadsWithUnread = leads.map((lead) => ({
      ...lead,
      unreadCount: unreadMap[lead.id] || 0,
    }))

    return NextResponse.json({
      data: leadsWithUnread,
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
    const rateLimit = applyRateLimit(request, 'public-leads-post', { max: 20, windowMs: 60_000 })
    if (!rateLimit.ok) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde para enviar um novo contato.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

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