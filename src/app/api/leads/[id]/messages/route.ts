import { NextResponse } from "next/server"
import { LeadMessageSender, LeadMessageType } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  sender: z.nativeEnum(LeadMessageSender).default(LeadMessageSender.HUMAN),
  type: z.nativeEnum(LeadMessageType).default(LeadMessageType.TEXT),
  sendToWhatsapp: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500)

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        whatsappPhone: true,
      },
    })
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    const messages = await prisma.leadMessage.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "asc" },
      take: limit,
    })

    return NextResponse.json({ data: messages })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const payload = createMessageSchema.parse(body)

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        whatsappPhone: true,
      },
    })
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    const now = new Date()
    const message = await prisma.leadMessage.create({
      data: {
        leadId: id,
        content: payload.content,
        sender: payload.sender,
        type: payload.type,
        readAt: payload.sender === LeadMessageSender.CUSTOMER ? null : now,
        metadata: payload.metadata,
        createdAt: now,
      },
    })

    await prisma.lead.update({
      where: { id },
      data: { lastMessageAt: now },
    })

    if (payload.sendToWhatsapp && payload.sender === LeadMessageSender.HUMAN) {
      const webhookUrl = process.env.N8N_HUMAN_HANDOFF_WEBHOOK_URL

      if (!webhookUrl) {
        await prisma.leadMessage.update({
          where: { id: message.id },
          data: {
            metadata: {
              ...(payload.metadata || {}),
              deliveryStatus: 'failed',
              deliveryError: 'N8N_HUMAN_HANDOFF_WEBHOOK_URL não configurado',
            },
          },
        })

        return NextResponse.json(
          { error: 'Webhook de handoff não configurado para envio de mensagem humana.' },
          { status: 500 },
        )
      }

      const token = process.env.N8N_HUMAN_HANDOFF_TOKEN
      const targetPhone = lead.whatsappPhone || lead.phone

      if (!targetPhone) {
        return NextResponse.json(
          { error: 'Lead não possui telefone/whatsapp para envio.' },
          { status: 400 },
        )
      }

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            source: 'admin-panel',
            leadId: lead.id,
            leadName: lead.name,
            phone: targetPhone,
            content: payload.content,
            messageType: payload.type,
            sender: 'human',
            createdAt: now.toISOString(),
          }),
        })

        if (!response.ok) {
          const responseText = await response.text()
          await prisma.leadMessage.update({
            where: { id: message.id },
            data: {
              metadata: {
                ...(payload.metadata || {}),
                deliveryStatus: 'failed',
                deliveryError: responseText || `HTTP ${response.status}`,
              },
            },
          })

          return NextResponse.json(
            { error: 'Falha ao enviar mensagem para WhatsApp via n8n.' },
            { status: 502 },
          )
        }

        await prisma.leadMessage.update({
          where: { id: message.id },
          data: {
            metadata: {
              ...(payload.metadata || {}),
              deliveryStatus: 'sent',
              deliveredAt: new Date().toISOString(),
            },
          },
        })
      } catch (error: any) {
        await prisma.leadMessage.update({
          where: { id: message.id },
          data: {
            metadata: {
              ...(payload.metadata || {}),
              deliveryStatus: 'failed',
              deliveryError: error?.message || 'Erro desconhecido no envio',
            },
          },
        })

        return NextResponse.json(
          { error: 'Erro ao enviar mensagem para WhatsApp via n8n.' },
          { status: 502 },
        )
      }
    }

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao criar mensagem" }, { status: 500 })
  }
}
