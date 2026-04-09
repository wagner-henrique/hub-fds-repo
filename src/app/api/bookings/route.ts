import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { bookingSchema, paginationSchema } from "@/lib/validations"
import { parseBrazilOrIsoDateToUtc } from "@/lib/date-brazil"
import { processDirectPayment } from "@/lib/mercadopago"
import { BookingStatus, Prisma } from "@prisma/client"
import { z } from "zod"
import { requireRole } from "@/lib/auth-guards"

const cardPaymentSchema = z.object({
  method: z.literal("card"),
  token: z.string().min(1),
  issuer_id: z.string().optional().nullable(),
  payment_method_id: z.string().min(1),
  installments: z.number().int().min(1),
  payer: z.object({
    email: z.string().email(),
    identification: z
      .object({
        type: z.string().min(1),
        number: z.string().min(1),
      })
      .optional()
      .nullable(),
  }),
})

const pixPaymentSchema = z.object({
  method: z.literal("pix"),
})

const manualPaymentSchema = z.object({
  method: z.literal("manual"),
  status: z.nativeEnum(BookingStatus).optional(),
  source: z.enum(["whatsapp", "presencial", "admin"]).optional(),
})

const checkoutPaymentSchema = z.discriminatedUnion("method", [cardPaymentSchema, pixPaymentSchema, manualPaymentSchema])

const isInvalidDate = (value: Date) => Number.isNaN(value.getTime())

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const availabilityDate = searchParams.get("date")
    const availabilityRoom = searchParams.get("room")
    if (availabilityDate && availabilityRoom) {
      const bookingDate = parseBrazilOrIsoDateToUtc(availabilityDate)
      if (!bookingDate || isInvalidDate(bookingDate)) {
        return NextResponse.json({ error: "Data inválida" }, { status: 400 })
      }

      const reservedBookings = await prisma.booking.findMany({
        where: {
          date: bookingDate,
          room: availabilityRoom,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
        },
        select: { time: true },
        orderBy: { time: "asc" },
      })

      return NextResponse.json({
        date: availabilityDate,
        room: availabilityRoom,
        bookedSlots: reservedBookings.map((booking) => booking.time),
      })
    }

    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const queryParams = Object.fromEntries(searchParams.entries())
    const { page, limit } = paginationSchema.parse(queryParams)
    const listDate = searchParams.get("date")
    const listRoom = searchParams.get("room")
    const listBookingDate = listDate ? parseBrazilOrIsoDateToUtc(listDate) : null

    const skip = (page - 1) * limit

    if (listDate && !listBookingDate) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 })
    }

    const where = {
      ...(listBookingDate ? { date: listBookingDate } : {}),
      ...(listRoom ? { room: listRoom } : {}),
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: "asc" }, { time: "asc" }],
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)
    const paymentData = checkoutPaymentSchema.parse(body.payment)

    if (validatedData.room === "coworking" && paymentData.method !== "manual") {
      return NextResponse.json({ error: "Reservas de coworking devem ser feitas via WhatsApp" }, { status: 400 })
    }

    if (paymentData.method === "manual") {
      const session = await requireRole(["ADMIN", "RECEPTION"])
      if (!session) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
      }
    }

    const bookingDate = parseBrazilOrIsoDateToUtc(validatedData.date)
    if (!bookingDate) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 })
    }

    const dayOfWeek = bookingDate.getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const times = Array.isArray(validatedData.time) ? validatedData.time : [validatedData.time]
    const hours = times.length
    let totalPrice = 0

    if (validatedData.room === "auditorio") {
      totalPrice = isWeekend ? 810 : 730
    } else if (validatedData.room === "treinamento") {
      totalPrice = isWeekend ? 680 : 600
    } else if (validatedData.room === "arapiraca") {
      totalPrice = isWeekend ? 600 : 500
    } else if (validatedData.room === "reuniao") {
      if (hours <= 2) {
        totalPrice = hours * 100
      } else if (hours <= 4) {
        totalPrice = 299 // Turno
      } else {
        totalPrice = 640 // Diária
      }
    }

    const manualSourceLabel = paymentData.method === "manual"
      ? paymentData.source === "whatsapp" ? "WhatsApp" : paymentData.source === "presencial" ? "Presencial" : "Admin"
      : null

    const linkedClient = await prisma.client.findUnique({
      where: { email: validatedData.email },
      select: { id: true },
    })

    let createdBookings = []
    const groupId = `GRP-${Date.now()}`

    try {
      createdBookings = await prisma.$transaction(
        times.map(timeStr => prisma.booking.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            clientId: linkedClient?.id,
            room: validatedData.room,
            date: bookingDate,
            time: timeStr,
            notes: paymentData.method === "manual"
              ? `[Manual: ${manualSourceLabel}] [Grupo:${groupId}] ${validatedData.notes || ""}`
              : `[Grupo:${groupId}] ${validatedData.notes || ""}`,
            status: paymentData.method === "manual" ? (paymentData.status ?? BookingStatus.CONFIRMED) : BookingStatus.PENDING
          }
        }))
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Um ou mais horários estão indisponíveis" }, { status: 409 })
      }
      throw error
    }

    const primaryBooking = createdBookings[0]
    const bookingIds = createdBookings.map(b => b.id)

    if (paymentData.method === "manual") {
      return NextResponse.json({ booking: primaryBooking, payment: { method: "manual", status: "manual_confirmed" } }, { status: 201 })
    }

    const paymentPayload = paymentData.method === "card"
      ? {
          token: paymentData.token,
          issuer_id: paymentData.issuer_id ?? undefined,
          payment_method_id: paymentData.payment_method_id,
          transaction_amount: totalPrice,
          installments: paymentData.installments,
          payer: { email: paymentData.payer.email, identification: paymentData.payer.identification ?? undefined },
        }
      : {
          payment_method_id: "pix",
          transaction_amount: totalPrice,
          payer: { email: validatedData.email },
        }

    let paymentResponse
    try {
      paymentResponse = await processDirectPayment(paymentPayload, primaryBooking.id)
    } catch {
      await prisma.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: BookingStatus.CANCELLED, notes: `[Pagamento não processado]` },
      })
      return NextResponse.json({ error: "Falha ao processar o pagamento." }, { status: 502 })
    }

    let nextBookingStatus: BookingStatus = BookingStatus.PENDING
    if (paymentResponse.status === "approved") nextBookingStatus = BookingStatus.CONFIRMED
    else if (paymentResponse.status === "rejected" || paymentResponse.status === "cancelled") nextBookingStatus = BookingStatus.CANCELLED

    await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: nextBookingStatus },
    })

    return NextResponse.json({
      booking: primaryBooking, 
      payment: {
        id: paymentResponse.id,
        status: paymentResponse.status,
        statusDetail: paymentResponse.status_detail,
        method: paymentData.method,
        pix: paymentData.method === "pix" ? {
          qrCode: paymentResponse.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64,
        } : undefined,
      },
    }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Falha ao processar a reserva" }, { status: 500 })
  }
}