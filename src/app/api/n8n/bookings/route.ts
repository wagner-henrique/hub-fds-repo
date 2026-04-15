import { NextResponse } from "next/server"
import { BookingStatus, Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { isN8nAuthorized } from "@/lib/n8n-auth"
import { parseBrazilOrIsoDateToUtc } from "@/lib/date-brazil"
import { processDirectPayment } from "@/lib/mercadopago" 
import { applyRateLimit } from "@/lib/rate-limit"

const roomMap: Record<string, string> = {
  "reuniao": "reuniao",
  "sala de reuniao": "reuniao",
  "sala_reuniao": "reuniao",
  "treinamento": "treinamento",
  "centro de treinamento": "treinamento",
  "centro_treinamento": "treinamento",
  "coworking": "coworking",
  "estacao de trabalho": "coworking",
  "estacao_trabalho": "coworking",
  "sala arapiraca": "arapiraca",
  "sala_arapiraca": "arapiraca",
  "arapiraca": "arapiraca",
  "auditorio": "auditorio",
}

// Esquemas Zod mais resilientes com .trim() e .nullable()
const createBookingSchema = z.object({
  idReserva: z.string().optional().nullable(),
  bookingId: z.string().optional().nullable(),
  nomeCliente: z.string().trim().min(2),
  email: z.string().email().optional().nullable(),
  telefone: z.string().trim().min(8),
  tipoEspaco: z.string().trim().min(2),
  dataAgendamento: z.string().trim().min(8),
  horarioInicio: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM"),
  horarioFim: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable().or(z.literal("")),
  numeroPessoas: z.coerce.number().int().min(1).optional().nullable(),
  observacoes: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(BookingStatus).optional().nullable(),
  valorSinal: z.coerce.number().optional().nullable(), 
})

const updateBookingSchema = z.object({
  bookingId: z.string().optional().nullable(),
  idReserva: z.string().optional().nullable(),
  nomeCliente: z.string().trim().min(2).optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().trim().min(8).optional().nullable(),
  tipoEspaco: z.string().trim().min(2).optional().nullable(),
  dataAgendamento: z.string().trim().min(8).optional().nullable(),
  horarioInicio: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  horarioFim: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable().or(z.literal("")),
  numeroPessoas: z.coerce.number().int().min(1).optional().nullable(),
  observacoes: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(BookingStatus).optional().nullable(),
}).refine((data) => Boolean(data.bookingId || data.idReserva), {
  message: "Informe bookingId ou idReserva",
  path: ["bookingId"],
})

const listBookingsSchema = z.object({
  bookingId: z.string().optional().nullable(),
  idReserva: z.string().optional().nullable(),
  telefone: z.string().trim().optional().nullable(),
  room: z.string().trim().optional().nullable(),
  date: z.string().trim().optional().nullable(),
  status: z.nativeEnum(BookingStatus).optional().nullable(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const cancelBookingSchema = z.object({
  bookingId: z.string().optional().nullable(),
  idReserva: z.string().optional().nullable(),
}).refine((data) => Boolean(data.bookingId || data.idReserva), {
  message: "Informe bookingId ou idReserva",
  path: ["bookingId"],
})

function normalizeRoom(input: string): string | null {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

  return roomMap[normalized] || null
}

function parseDateInput(value: string): Date | null {
  return parseBrazilOrIsoDateToUtc(value)
}

function generateReservaId(): string {
  return `RSV-${Math.floor(100000 + Math.random() * 900000)}`
}

function normalizePhoneForEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return "cliente"
  return digits
}

function appendN8nMeta(
  notes: string | undefined | null,
  meta: { idReserva: string; horarioFim?: string | null; numeroPessoas?: number | null },
): string {
  const parts: string[] = []

  parts.push(`[ID_Reserva:${meta.idReserva}]`)

  if (meta.horarioFim) {
    parts.push(`[Horario_Fim:${meta.horarioFim}]`)
  }

  if (meta.numeroPessoas) {
    parts.push(`[Numero_Pessoas:${meta.numeroPessoas}]`)
  }

  if (notes?.trim()) {
    parts.push(notes.trim())
  }

  return parts.join(" ")
}

async function findBookingByIdentifiers(payload: { bookingId?: string | null; idReserva?: string | null }) {
  if (payload.bookingId) {
    return prisma.booking.findUnique({ where: { id: payload.bookingId } })
  }

  if (payload.idReserva) {
    return prisma.booking.findFirst({
      where: {
        notes: {
          contains: `[ID_Reserva:${payload.idReserva}]`,
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  return null
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Não autorizado para integração n8n" }, { status: 401 })
}

export async function GET(request: Request) {
  if (!isN8nAuthorized(request)) return unauthorizedResponse()

  const rateLimit = applyRateLimit(request, "n8n-bookings-get", { max: 120, windowMs: 60_000 })
  if (!rateLimit.ok) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
    return NextResponse.json(
      { error: "Muitas requisições para integração n8n" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const params = listBookingsSchema.parse(queryParams)

    const identified = await findBookingByIdentifiers({
      bookingId: params.bookingId,
      idReserva: params.idReserva,
    })

    if (params.bookingId || params.idReserva) {
      if (!identified) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })
      return NextResponse.json({ data: identified })
    }

    const room = params.room ? normalizeRoom(params.room) : null
    if (params.room && !room) return NextResponse.json({ error: "Tipo de espaço inválido" }, { status: 400 })

    const date = params.date ? parseDateInput(params.date) : null
    if (params.date && !date) return NextResponse.json({ error: "Data inválida" }, { status: 400 })

    const where: Prisma.BookingWhereInput = {
      ...(params.telefone ? { phone: params.telefone } : {}),
      ...(room ? { room } : {}),
      ...(date ? { date } : {}),
      ...(params.status ? { status: params.status } : {}),
    }

    const skip = (params.page - 1) * params.limit

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: [{ date: "asc" }, { time: "asc" }],
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      data: bookings,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Erro ao buscar reservas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isN8nAuthorized(request)) return unauthorizedResponse()

  const rateLimit = applyRateLimit(request, "n8n-bookings-post", { max: 120, windowMs: 60_000 })
  if (!rateLimit.ok) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
    return NextResponse.json(
      { error: "Muitas requisições para integração n8n" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  try {
    const body = await request.json()
    const payload = createBookingSchema.parse(body)

    const room = normalizeRoom(payload.tipoEspaco)
    if (!room) return NextResponse.json({ error: "Tipo de espaço inválido" }, { status: 400 })

    const bookingDate = parseDateInput(payload.dataAgendamento)
    if (!bookingDate) return NextResponse.json({ error: "Data inválida" }, { status: 400 })

    const idReserva = payload.idReserva || generateReservaId()

    try {
      const booking = await prisma.booking.create({
        data: {
          name: payload.nomeCliente,
          email: payload.email || `${normalizePhoneForEmail(payload.telefone)}@hub-fds.com.br`,
          phone: payload.telefone,
          room,
          date: bookingDate,
          time: payload.horarioInicio,
          notes: appendN8nMeta(payload.observacoes, {
            idReserva,
            horarioFim: payload.horarioFim,
            numeroPessoas: payload.numeroPessoas,
          }),
          status: payload.status || BookingStatus.PENDING,
        },
      })

      let pixCopiaECola = null

      if (payload.valorSinal && payload.valorSinal > 0) {
        try {
          const firstName = payload.nomeCliente.split(" ")[0];
          const lastName = payload.nomeCliente.split(" ").slice(1).join(" ") || "Cliente";

          const paymentResponse = await processDirectPayment({
            payment_method_id: "pix",
            transaction_amount: Number(payload.valorSinal),
            payer: {
              email: payload.email || `${normalizePhoneForEmail(payload.telefone)}@hub-fds.com.br`,
              first_name: firstName,
              last_name: lastName,
            },
          }, booking.id)

          pixCopiaECola = paymentResponse?.point_of_interaction?.transaction_data?.qr_code || null;

          if (pixCopiaECola) {
            const n8nPixUrl = process.env.N8N_SEND_PIX_URL;
            if (n8nPixUrl) {
              try {
                await fetch(n8nPixUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    phone: payload.telefone,
                    pixCode: pixCopiaECola,
                    room: room,
                    value: payload.valorSinal
                  }),
                });
              } catch (e) {
                console.error(e);
              }
            }
          } else {
            console.error(paymentResponse);
          }
        } catch (error) {
          console.error(error)
        }
      }

      return NextResponse.json({ 
        data: booking, 
        idReserva,
        pixCopiaECola 
      }, { status: 201 })

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Horário indisponível para este espaço" }, { status: 409 })
      }
      throw error
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Erro ao criar reserva" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!isN8nAuthorized(request)) return unauthorizedResponse()

  const rateLimit = applyRateLimit(request, "n8n-bookings-patch", { max: 120, windowMs: 60_000 })
  if (!rateLimit.ok) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
    return NextResponse.json(
      { error: "Muitas requisições para integração n8n" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  try {
    const body = await request.json()
    const payload = updateBookingSchema.parse(body)

    const booking = await findBookingByIdentifiers({
      bookingId: payload.bookingId,
      idReserva: payload.idReserva,
    })

    if (!booking) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })

    const room = payload.tipoEspaco ? normalizeRoom(payload.tipoEspaco) : null
    if (payload.tipoEspaco && !room) return NextResponse.json({ error: "Tipo de espaço inválido" }, { status: 400 })

    const bookingDate = payload.dataAgendamento ? parseDateInput(payload.dataAgendamento) : null
    if (payload.dataAgendamento && !bookingDate) return NextResponse.json({ error: "Data inválida" }, { status: 400 })

    const currentReservaIdMatch = booking.notes?.match(/\[ID_Reserva:([^\]]+)\]/)
    const currentReservaId = payload.idReserva || currentReservaIdMatch?.[1] || generateReservaId()

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        ...(payload.nomeCliente ? { name: payload.nomeCliente } : {}),
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.telefone ? { phone: payload.telefone } : {}),
        ...(room ? { room } : {}),
        ...(bookingDate ? { date: bookingDate } : {}),
        ...(payload.horarioInicio ? { time: payload.horarioInicio } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...((payload.observacoes || payload.horarioFim || payload.numeroPessoas)
          ? {
              notes: appendN8nMeta(payload.observacoes || booking.notes || "", {
                idReserva: currentReservaId,
                horarioFim: payload.horarioFim,
                numeroPessoas: payload.numeroPessoas,
              }),
            }
          : {}),
      },
    })

    return NextResponse.json({ data: updated, idReserva: currentReservaId })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Erro ao modificar reserva" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isN8nAuthorized(request)) return unauthorizedResponse()

  const rateLimit = applyRateLimit(request, "n8n-bookings-delete", { max: 120, windowMs: 60_000 })
  if (!rateLimit.ok) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
    return NextResponse.json(
      { error: "Muitas requisições para integração n8n" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const cancelBookingSchema = z.object({
      bookingId: z.string().optional().nullable(),
      idReserva: z.string().optional().nullable(),
    }).refine((data) => Boolean(data.bookingId || data.idReserva), {
      message: "Informe bookingId ou idReserva",
      path: ["bookingId"],
    })
    
    const payload = cancelBookingSchema.parse(body)

    const booking = await findBookingByIdentifiers({
      bookingId: payload.bookingId,
      idReserva: payload.idReserva,
    })

    if (!booking) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })

    const cancelled = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
    })

    return NextResponse.json({ data: cancelled })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Erro ao cancelar reserva" }, { status: 500 })
  }
}