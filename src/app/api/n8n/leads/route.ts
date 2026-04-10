import { NextResponse } from "next/server"
import { LeadAiStatus, LeadMessageSender, LeadMessageType } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { isN8nAuthorized } from "@/lib/n8n-auth"

const syncLeadMessageSchema = z.object({
  phone: z.string().trim().min(6),
  pushName: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).max(5000),
  sender: z.nativeEnum(LeadMessageSender),
  type: z.nativeEnum(LeadMessageType).default(LeadMessageType.TEXT),
  source: z.string().trim().optional(),
  metadata: z.record(z.any()).optional(),
  receivedAt: z.string().datetime().optional(),
})

function unauthorizedResponse() {
  return NextResponse.json({ error: "Não autorizado para integração n8n" }, { status: 401 })
}

function normalizeWhatsappPhone(phone: string): string {
  const normalized = phone.trim().toLowerCase().replace(/@s\.whatsapp\.net$/i, "")
  const digits = normalized.replace(/\D/g, "")
  return digits || normalized
}

function buildLeadEmail(phone: string): string {
  return `wa-${phone}@hub-fds.local`
}

async function findLeadByPhone(normalizedPhone: string) {
  return prisma.lead.findFirst({
    where: {
      OR: [
        { whatsappPhone: normalizedPhone },
        { phone: normalizedPhone },
      ],
    },
  })
}

export async function GET(request: Request) {
  if (!isN8nAuthorized(request)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const phoneParam = searchParams.get("phone")

    if (!phoneParam) {
      return NextResponse.json({ error: "Informe o telefone" }, { status: 400 })
    }

    const normalizedPhone = normalizeWhatsappPhone(phoneParam)
    const lead = await findLeadByPhone(normalizedPhone)

    if (!lead) {
      return NextResponse.json({
        data: {
          exists: false,
          aiStatus: LeadAiStatus.ACTIVE,
          shouldRespondWithAi: true,
        },
      })
    }

    return NextResponse.json({
      data: {
        exists: true,
        leadId: lead.id,
        aiStatus: lead.aiStatus,
        shouldRespondWithAi: lead.aiStatus === LeadAiStatus.ACTIVE,
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao consultar status do lead" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isN8nAuthorized(request)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const payload = syncLeadMessageSchema.parse(body)
    const normalizedPhone = normalizeWhatsappPhone(payload.phone)
    const now = payload.receivedAt ? new Date(payload.receivedAt) : new Date()

    const existingLead = await findLeadByPhone(normalizedPhone)

    const lead = existingLead
      ? await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            name: payload.pushName || existingLead.name,
            phone: existingLead.phone || normalizedPhone,
            whatsappPhone: existingLead.whatsappPhone || normalizedPhone,
            source: payload.source || existingLead.source,
            lastMessageAt: now,
          },
        })
      : await prisma.lead.create({
          data: {
            name: payload.pushName || "Cliente WhatsApp",
            email: buildLeadEmail(normalizedPhone),
            phone: normalizedPhone,
            whatsappPhone: normalizedPhone,
            source: payload.source || "whatsapp",
            status: "NEW",
            aiStatus: LeadAiStatus.ACTIVE,
            lastMessageAt: now,
          },
        })

    const message = await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        sender: payload.sender,
        type: payload.type,
        content: payload.content,
        readAt: payload.sender === 'CUSTOMER' ? null : now,
        metadata: payload.metadata,
        createdAt: now,
      },
    })

    return NextResponse.json({
      data: {
        leadId: lead.id,
        messageId: message.id,
        aiStatus: lead.aiStatus,
        shouldRespondWithAi: lead.aiStatus === LeadAiStatus.ACTIVE,
      },
    })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Conflito de lead para o telefone informado" }, { status: 409 })
    }

    return NextResponse.json({ error: "Erro ao sincronizar lead/mensagem" }, { status: 500 })
  }
}
