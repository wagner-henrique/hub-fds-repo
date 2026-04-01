import { NextResponse } from "next/server"
import { BookingStatus, Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { isN8nAuthorized } from "@/lib/n8n-auth"
import { parseBrazilOrIsoDateToUtc } from "@/lib/date-brazil"

const roomMap: Record<string, "reuniao" | "treinamento" | "coworking"> = {
  reuniao: "reuniao",
  "sala de reunião": "reuniao",
  sala_reuniao: "reuniao",
  treinamento: "treinamento",
  "centro de treinamento": "treinamento",
  centro_treinamento: "treinamento",
  coworking: "coworking",
  "estação de trabalho": "coworking",
  estacao_trabalho: "coworking",
}

const createBookingSchema = z.object({
  idReserva: z.string().optional(),
  bookingId: z.string().optional(),
  nomeCliente: z.string().min(2),
  email: z.string().email().optional(),
  telefone: z.string().min(8),
  tipoEspaco: z.string().min(2),
  dataAgendamento: z.string().min(8),
  horarioInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  horarioFim: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  numeroPessoas: z.coerce.number().int().min(1).optional(),
  observacoes: z.string().max(1000).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
})

const updateBookingSchema = z.object({
  bookingId: z.string().optional(),
  idReserva: z.string().optional(),
  nomeCliente: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(8).optional(),
  tipoEspaco: z.string().min(2).optional(),
  dataAgendamento: z.string().min(8).optional(),
  horarioInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  horarioFim: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  numeroPessoas: z.coerce.number().int().min(1).optional(),
  observacoes: z.string().max(1000).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
}).refine((data) => Boolean(data.bookingId || data.idReserva), {
  message: "Informe bookingId ou idReserva",
  path: ["bookingId"],
})

const listBookingsSchema = z.object({
  bookingId: z.string().optional(),
  idReserva: z.string().optional(),
  telefone: z.string().optional(),
  room: z.string().optional(),
  date: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const cancelBookingSchema = z.object({
  bookingId: z.string().optional(),
  idReserva: z.string().optional(),
}).refine((data) => Boolean(data.bookingId || data.idReserva), {
  message: "Informe bookingId ou idReserva",
  path: ["bookingId"],
})

function normalizeRoom(input: string): "reuniao" | "treinamento" | "coworking" | null {
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
  notes: string | undefined,
  meta: { idReserva: string; horarioFim?: string; numeroPessoas?: number },
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

async function findBookingByIdentifiers(payload: { bookingId?: string; idReserva?: string }) {
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
  if (!isN8nAuthorized(request)) {
    return unauthorizedResponse()
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
      if (!identified) {
        return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })
      }

      return NextResponse.json({ data: identified })
    }

    const room = params.room ? normalizeRoom(params.room) : null
    if (params.room && !room) {
      return NextResponse.json({ error: "Tipo de espaço inválido" }, { status: 400 })
    }

    const date = params.date ? parseDateInput(params.date) : null
    if (params.date && !date) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 })
    }

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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao buscar reservas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isN8nAuthorized(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const payload = createBookingSchema.parse(body)

    const room = normalizeRoom(payload.tipoEspaco)
    if (!room) {
      return NextResponse.json({ error: "Tipo de espaço inválido" }, { status: 400 })
    }

    const bookingDate = parseDateInput(payload.dataAgendamento)
    if (!bookingDate) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 })
    }

    const idReserva = payload.idReserva || generateReservaId()

    try {
      const booking = await prisma.booking.create({
        data: {
          name: payload.nomeCliente,
          email: payload.email || `${normalizePhoneForEmail(payload.telefone)}@hub-fds.local`,
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

      return NextResponse.json({
        data: booking,
        idReserva,
      }, { status: 201 })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Horário indisponível para este espaço" }, { status: 409 })
      }
      throw error
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao criar reserva" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!isN8nAuthorized(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const payload = updateBookingSchema.parse(body)

    const booking = await findBookingByIdentifiers({
      bookingId: payload.bookingId,
      idReserva: payload.idReserva,
    })

    if (!booking) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })
    }

    const room = payload.tipoEspaco ? normalizeRoom(payload.tipoEspaco) : null
    if (payload.tipoEspaco && !room) {
      return NextResponse.json({ error: "Tipo de espaço inválido" }, { status: 400 })
    }

    const bookingDate = payload.dataAgendamento ? parseDateInput(payload.dataAgendamento) : null
    if (payload.dataAgendamento && !bookingDate) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 })
    }

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

    return NextResponse.json({
      data: updated,
      idReserva: currentReservaId,
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao modificar reserva" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isN8nAuthorized(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const payload = cancelBookingSchema.parse(body)

    const booking = await findBookingByIdentifiers({
      bookingId: payload.bookingId,
      idReserva: payload.idReserva,
    })

    if (!booking) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })
    }

    const cancelled = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
    })

    return NextResponse.json({ data: cancelled })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao cancelar reserva" }, { status: 500 })
  }
}
