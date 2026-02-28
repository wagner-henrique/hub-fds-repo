import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { bookingSchema, paginationSchema } from "@/lib/validations"
import { processDirectPayment } from "@/lib/mercadopago"
import { BookingStatus } from "@prisma/client"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const availabilityDate = searchParams.get("date")
    const availabilityRoom = searchParams.get("room")
    if (availabilityDate && availabilityRoom) {
      const bookingDate = new Date(availabilityDate)
      bookingDate.setUTCHours(0, 0, 0, 0)

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

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const queryParams = Object.fromEntries(searchParams.entries())
    const { page, limit } = paginationSchema.parse(queryParams)
    const listDate = searchParams.get("date")
    const listRoom = searchParams.get("room")

    const skip = (page - 1) * limit

    const where = {
      ...(listDate
        ? (() => {
            const bookingDate = new Date(listDate)
            bookingDate.setUTCHours(0, 0, 0, 0)
            return { date: bookingDate }
          })()
        : {}),
      ...(listRoom ? { room: listRoom } : {}),
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "asc" },
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
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
      }
    }

    const bookingDate = new Date(validatedData.date)
    bookingDate.setUTCHours(0, 0, 0, 0)

    const existingBooking = await prisma.booking.findFirst({
      where: {
        room: validatedData.room,
        date: bookingDate,
        time: validatedData.time,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING]
        }
      }
    })

    if (existingBooking) {
      return NextResponse.json({ error: "Horário indisponível para esta sala" }, { status: 409 })
    }

    const manualSourceLabel = paymentData.method === "manual"
      ? paymentData.source === "whatsapp"
        ? "WhatsApp"
        : paymentData.source === "presencial"
          ? "Presencial"
          : "Admin"
      : null

    const booking = await prisma.booking.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        room: validatedData.room,
        date: bookingDate,
        time: validatedData.time,
        notes: paymentData.method === "manual"
          ? `[Manual: ${manualSourceLabel}]${validatedData.notes ? ` ${validatedData.notes}` : ""}`
          : validatedData.notes,
        status: paymentData.method === "manual"
          ? paymentData.status ?? BookingStatus.CONFIRMED
          : BookingStatus.PENDING
      },
    })

    let unitPrice = 50.00

    if (validatedData.room === "treinamento") {
      unitPrice = 150.00
    }

    if (paymentData.method === "manual") {
      return NextResponse.json(
        {
          booking,
          payment: {
            method: "manual",
            status: "manual_confirmed",
          },
        },
        { status: 201 },
      )
    }

    const paymentPayload =
      paymentData.method === "card"
        ? {
            token: paymentData.token,
            issuer_id: paymentData.issuer_id ?? undefined,
            payment_method_id: paymentData.payment_method_id,
            transaction_amount: unitPrice,
            installments: paymentData.installments,
            payer: {
              email: paymentData.payer.email,
              identification: paymentData.payer.identification ?? undefined,
            },
          }
        : {
            payment_method_id: "pix",
            transaction_amount: unitPrice,
            payer: {
              email: validatedData.email,
            },
          }

    const paymentResponse = await processDirectPayment(paymentPayload, booking.id)

    const paymentStatus = paymentResponse.status

    let nextBookingStatus: BookingStatus = BookingStatus.PENDING
    if (paymentStatus === "approved") {
      nextBookingStatus = BookingStatus.CONFIRMED
    } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      nextBookingStatus = BookingStatus.CANCELLED
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: nextBookingStatus },
    })

    return NextResponse.json(
      {
        booking: updatedBooking,
        payment: {
          id: paymentResponse.id,
          status: paymentResponse.status,
          statusDetail: paymentResponse.status_detail,
          method: paymentData.method,
          pix: paymentData.method === "pix"
            ? {
                qrCode: paymentResponse.point_of_interaction?.transaction_data?.qr_code,
                qrCodeBase64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64,
              }
            : undefined,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Falha ao processar a reserva" }, { status: 500 })
  }
}