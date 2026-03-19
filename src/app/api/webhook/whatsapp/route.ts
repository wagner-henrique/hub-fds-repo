import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { bookingSchema, leadSchema } from "@/lib/validations"
import { BookingStatus, LeadStatus } from "@prisma/client"
import { z } from "zod"

const bookingStatusSchema = z.nativeEnum(BookingStatus)

const leadUpsertEventSchema = z.object({
  type: z.literal("lead.upsert"),
  payload: leadSchema.extend({
    status: z.nativeEnum(LeadStatus).optional(),
  }),
})

const bookingCreateEventSchema = z.object({
  type: z.literal("booking.create"),
  payload: bookingSchema.extend({
    status: bookingStatusSchema.optional(),
    source: z.string().optional(),
  }),
})

const bookingStatusUpdateEventSchema = z.object({
  type: z.literal("booking.update_status"),
  payload: z.object({
    bookingId: z.string().min(1),
    status: bookingStatusSchema,
    notes: z.string().max(500).optional().nullable(),
  }),
})

const paymentRegisterEventSchema = z.object({
  type: z.literal("payment.register"),
  payload: z
    .object({
      bookingId: z.string().min(1).optional(),
      lookup: z
        .object({
          email: z.string().email(),
          room: z.enum(["reuniao", "treinamento", "coworking"]),
          date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Formato de data invalido",
          }),
          time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        })
        .optional(),
      paymentId: z.string().min(1),
      status: z.enum(["approved", "pending", "rejected", "cancelled", "refunded"]),
      amount: z.number().positive().optional(),
      method: z.string().max(50).optional(),
      notes: z.string().max(500).optional().nullable(),
    })
    .refine((value) => value.bookingId || value.lookup, {
      message: "Informe bookingId ou lookup para identificar a reserva",
      path: ["bookingId"],
    }),
})

const webhookEventSchema = z.discriminatedUnion("type", [
  leadUpsertEventSchema,
  bookingCreateEventSchema,
  bookingStatusUpdateEventSchema,
  paymentRegisterEventSchema,
])

function unauthorizedResponse() {
  return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
}

function requireWebhookToken(request: Request) {
  const configuredToken = process.env.N8N_WEBHOOK_TOKEN
  if (!configuredToken) {
    return NextResponse.json(
      {
        error: "Webhook token nao configurado",
        details: "Defina N8N_WEBHOOK_TOKEN no ambiente",
      },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get("authorization")
  const headerToken = request.headers.get("x-n8n-token")
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : undefined

  if (headerToken !== configuredToken && bearerToken !== configuredToken) {
    return unauthorizedResponse()
  }

  return null
}

function normalizeBookingDate(dateInput: string) {
  const date = new Date(dateInput)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

function mapPaymentToBookingStatus(paymentStatus: z.infer<typeof paymentRegisterEventSchema>["payload"]["status"]) {
  if (paymentStatus === "approved") {
    return BookingStatus.CONFIRMED
  }

  if (paymentStatus === "rejected" || paymentStatus === "cancelled" || paymentStatus === "refunded") {
    return BookingStatus.CANCELLED
  }

  return BookingStatus.PENDING
}

function appendNotes(base: string | null | undefined, newNote: string | null | undefined) {
  if (!newNote?.trim()) {
    return base
  }

  if (!base?.trim()) {
    return newNote.trim()
  }

  return `${base}\n${newNote.trim()}`
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "whatsapp-n8n-webhook",
    acceptedEvents: ["lead.upsert", "booking.create", "booking.update_status", "payment.register"],
  })
}

export async function POST(request: Request) {
  try {
    const authError = requireWebhookToken(request)
    if (authError) {
      return authError
    }

    const body = await request.json()
    const event = webhookEventSchema.parse(body)

    if (event.type === "lead.upsert") {
      const payload = event.payload
      const existingLead = await prisma.lead.findFirst({
        where: { email: payload.email },
        orderBy: { createdAt: "desc" },
      })

      const lead = existingLead
        ? await prisma.lead.update({
            where: { id: existingLead.id },
            data: {
              name: payload.name ?? existingLead.name,
              phone: payload.phone ?? existingLead.phone,
              source: payload.source || "whatsapp_n8n",
              status: payload.status ?? existingLead.status,
            },
          })
        : await prisma.lead.create({
            data: {
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              source: payload.source || "whatsapp_n8n",
              status: payload.status ?? LeadStatus.NEW,
            },
          })

      return NextResponse.json(
        {
          ok: true,
          event: event.type,
          data: lead,
        },
        { status: existingLead ? 200 : 201 },
      )
    }

    if (event.type === "booking.create") {
      const payload = event.payload
      const bookingDate = normalizeBookingDate(payload.date)

      const existingBooking = await prisma.booking.findFirst({
        where: {
          room: payload.room,
          date: bookingDate,
          time: payload.time,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
        },
      })

      if (existingBooking) {
        return NextResponse.json(
          {
            ok: false,
            event: event.type,
            error: "Horario indisponivel para esta sala",
            bookingId: existingBooking.id,
          },
          { status: 409 },
        )
      }

      const source = payload.source || "whatsapp_n8n"
      const sourcePrefix = `[Origem: ${source}]`

      const booking = await prisma.$transaction(async (tx) => {
        const existingLead = await tx.lead.findFirst({
          where: { email: payload.email },
          orderBy: { createdAt: "desc" },
        })

        if (existingLead) {
          await tx.lead.update({
            where: { id: existingLead.id },
            data: {
              name: payload.name,
              phone: payload.phone,
              source,
            },
          })
        } else {
          await tx.lead.create({
            data: {
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              source,
              status: LeadStatus.NEW,
            },
          })
        }

        return tx.booking.create({
          data: {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            room: payload.room,
            date: bookingDate,
            time: payload.time,
            status: payload.status ?? BookingStatus.PENDING,
            notes: appendNotes(payload.notes, sourcePrefix),
          },
        })
      })

      return NextResponse.json({ ok: true, event: event.type, data: booking }, { status: 201 })
    }

    if (event.type === "booking.update_status") {
      const { bookingId, status, notes } = event.payload

      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
      })

      if (!existingBooking) {
        return NextResponse.json(
          {
            ok: false,
            event: event.type,
            error: "Reserva nao encontrada",
          },
          { status: 404 },
        )
      }

      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status,
          notes: appendNotes(existingBooking.notes, notes),
        },
      })

      return NextResponse.json({ ok: true, event: event.type, data: booking })
    }

    const payload = event.payload

    const booking = payload.bookingId
      ? await prisma.booking.findUnique({ where: { id: payload.bookingId } })
      : await prisma.booking.findFirst({
          where: {
            email: payload.lookup!.email,
            room: payload.lookup!.room,
            date: normalizeBookingDate(payload.lookup!.date),
            time: payload.lookup!.time,
          },
          orderBy: { createdAt: "desc" },
        })

    if (!booking) {
      return NextResponse.json(
        {
          ok: false,
          event: event.type,
          error: "Reserva nao encontrada para registrar pagamento",
        },
        { status: 404 },
      )
    }

    const paymentLine = [
      `[Pagamento n8n] id=${payload.paymentId}`,
      `status=${payload.status}`,
      payload.amount ? `valor=${payload.amount.toFixed(2)}` : null,
      payload.method ? `metodo=${payload.method}` : null,
    ]
      .filter(Boolean)
      .join(" | ")

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: mapPaymentToBookingStatus(payload.status),
        notes: appendNotes(appendNotes(booking.notes, paymentLine), payload.notes),
      },
    })

    return NextResponse.json({
      ok: true,
      event: event.type,
      data: updatedBooking,
    })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validacao", details: error.errors }, { status: 400 })
    }

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Registro nao encontrado" }, { status: 404 })
    }

    return NextResponse.json({ error: "Erro interno no webhook do WhatsApp" }, { status: 500 })
  }
}
