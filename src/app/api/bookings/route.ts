import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { bookingSchema, paginationSchema } from "@/lib/validations"
import { parseBrazilOrIsoDateToUtc } from "@/lib/date-brazil"
import { processDirectPayment } from "@/lib/mercadopago"
import { BookingStatus, Prisma } from "@prisma/client"
import { z } from "zod"
import { requireRole } from "@/lib/auth-guards"
import { applyRateLimit } from "@/lib/rate-limit"

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
const paymentCoverageSchema = z.union([z.literal(50), z.literal(100)]).default(50)

const isInvalidDate = (value: Date) => Number.isNaN(value.getTime())

const MORNING_SHIFT_SLOTS = ["08:00", "09:00", "10:00", "11:00"]
const AFTERNOON_SHIFT_SLOTS = ["13:00", "14:00", "15:00", "16:00"]
const SHIFT_COMBINATIONS = [
  MORNING_SHIFT_SLOTS,
  AFTERNOON_SHIFT_SLOTS,
  [...MORNING_SHIFT_SLOTS, ...AFTERNOON_SHIFT_SLOTS],
]

function sortTimeSlots(times: string[]) {
  return [...times].sort((a, b) => a.localeCompare(b))
}

function areSameSlots(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return left.every((slot, index) => slot === right[index])
}

function getShiftCountFromTimes(times: string[]) {
  const sorted = sortTimeSlots(times)

  if (areSameSlots(sorted, MORNING_SHIFT_SLOTS)) return 1
  if (areSameSlots(sorted, AFTERNOON_SHIFT_SLOTS)) return 1
  if (areSameSlots(sorted, sortTimeSlots([...MORNING_SHIFT_SLOTS, ...AFTERNOON_SHIFT_SLOTS]))) return 2

  return 0
}

function isValidShiftSelection(times: string[]) {
  const sorted = sortTimeSlots(times)
  return SHIFT_COMBINATIONS.some((combination) => areSameSlots(sorted, sortTimeSlots(combination)))
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function parseTaggedNumber(notes: string | null | undefined, tag: string) {
  if (!notes) return null
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = notes.match(new RegExp(`\\[${escapedTag}:([^\\]]+)\\]`))
  if (!match?.[1]) return null
  const parsed = Number.parseFloat(match[1].replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

function parseTaggedInteger(notes: string | null | undefined, tag: string) {
  if (!notes) return null
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = notes.match(new RegExp(`\\[${escapedTag}:([^\\]]+)\\]`))
  if (!match?.[1]) return null
  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) ? parsed : null
}

function buildPaymentMeta(
  fullAmount: number,
  paidAmount: number,
  coveragePercent: 50 | 100,
) {
  const remainingAmount = roundMoney(Math.max(fullAmount - paidAmount, 0))
  return [
    `[Payment_Coverage:${coveragePercent}]`,
    `[Payment_Full:${roundMoney(fullAmount).toFixed(2)}]`,
    `[Payment_Paid:${roundMoney(paidAmount).toFixed(2)}]`,
    `[Payment_Remaining:${remainingAmount.toFixed(2)}]`,
  ].join(" ")
}

function withPaymentSummary<T extends { notes?: string | null }>(booking: T) {
  const coveragePercent = parseTaggedInteger(booking.notes, "Payment_Coverage")
  const fullAmount = parseTaggedNumber(booking.notes, "Payment_Full")
  const paidAmount = parseTaggedNumber(booking.notes, "Payment_Paid")
  const remainingAmount = parseTaggedNumber(booking.notes, "Payment_Remaining")

  if (
    (coveragePercent !== 50 && coveragePercent !== 100) ||
    fullAmount === null ||
    paidAmount === null ||
    remainingAmount === null
  ) {
    return {
      ...booking,
      paymentSummary: null,
    }
  }

  return {
    ...booking,
    paymentSummary: {
      coveragePercent,
      fullAmount,
      paidAmount,
      remainingAmount,
    },
  }
}

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
      data: bookings.map((booking) => withPaymentSummary(booking)),
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
    const rateLimit = applyRateLimit(request, "public-bookings-post", { max: 12, windowMs: 60_000 })
    if (!rateLimit.ok) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Muitas tentativas de reserva. Tente novamente em alguns instantes." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }

    const body = await request.json()
    const validatedData = bookingSchema.parse(body)
    const paymentData = checkoutPaymentSchema.parse(body.payment)
    const paymentCoverage = paymentCoverageSchema.parse(body.paymentCoverage)

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

    const times = Array.from(new Set(Array.isArray(validatedData.time) ? validatedData.time : [validatedData.time]))
    const hours = times.length
    let totalPrice = 0

    if ((validatedData.room === "auditorio" || validatedData.room === "treinamento") && !isValidShiftSelection(times)) {
      return NextResponse.json(
        { error: "Para Auditório e Centro de Treinamento, selecione apenas Manhã, Tarde ou os dois turnos." },
        { status: 400 },
      )
    }

    const selectedShiftCount = getShiftCountFromTimes(times)

    if (validatedData.room === "auditorio") {
      totalPrice = (isWeekend ? 810 : 730) * selectedShiftCount
    } else if (validatedData.room === "treinamento") {
      totalPrice = (isWeekend ? 680 : 600) * selectedShiftCount
    } else if (validatedData.room === "arapiraca") {
      if (isWeekend) {
        if (!isValidShiftSelection(times)) {
          return NextResponse.json(
            { error: "Na Sala Arapiraca aos fins de semana, a reserva deve ser por turno (Manhã, Tarde ou ambos)." },
            { status: 400 },
          )
        }

        totalPrice = 600 * getShiftCountFromTimes(times)
      } else if (isValidShiftSelection(times)) {
        totalPrice = 500 * getShiftCountFromTimes(times)
      } else {
        totalPrice = hours * 150
      }
    } else if (validatedData.room === "reuniao") {
      if (hours <= 2) {
        totalPrice = hours * 100
      } else if (hours <= 4) {
        totalPrice = 299 // Turno
      } else {
        totalPrice = 640 // Diária
      }
    }

    const extrasPrice =
      (validatedData.coffeeBreakSpace ? 150 : 0) +
      (validatedData.lunchOrDinnerStructure ? 500 : 0)

    totalPrice += extrasPrice
    const fullAmount = roundMoney(totalPrice)
    const amountToCharge = paymentData.method === "manual"
      ? fullAmount
      : roundMoney((fullAmount * paymentCoverage) / 100)

    const manualSourceLabel = paymentData.method === "manual"
      ? paymentData.source === "whatsapp" ? "WhatsApp" : paymentData.source === "presencial" ? "Presencial" : "Admin"
      : null

    const linkedClient = await prisma.client.findUnique({
      where: { email: validatedData.email },
      select: { id: true },
    })

    let createdBookings = []
    const groupId = `GRP-${Date.now()}`

    const extrasNotes = [
      validatedData.coffeeBreakSpace ? "[Extra:Espaco_Coffee_Break_R$150]" : null,
      validatedData.lunchOrDinnerStructure ? "[Extra:Almoco_ou_Jantar_R$500]" : null,
      "[Info:Uso_Recepcao_e_Copa_Incluso_No_Periodo_Contratado]",
    ].filter(Boolean).join(" ")

    const paymentNotes = buildPaymentMeta(
      fullAmount,
      amountToCharge,
      paymentData.method === "manual" ? 100 : paymentCoverage,
    )

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
              ? `[Manual: ${manualSourceLabel}] [Grupo:${groupId}] ${paymentNotes} ${extrasNotes} ${validatedData.notes || ""}`
              : `[Grupo:${groupId}] ${paymentNotes} ${extrasNotes} ${validatedData.notes || ""}`,
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
          transaction_amount: amountToCharge,
          installments: paymentData.installments,
          payer: { email: paymentData.payer.email, identification: paymentData.payer.identification ?? undefined },
        }
      : {
          payment_method_id: "pix",
          transaction_amount: amountToCharge,
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
      booking: withPaymentSummary(primaryBooking),
      payment: {
        id: paymentResponse.id,
        status: paymentResponse.status,
        statusDetail: paymentResponse.status_detail,
        method: paymentData.method,
        coveragePercent: paymentCoverage,
        fullAmount,
        paidAmount: amountToCharge,
        remainingAmount: roundMoney(fullAmount - amountToCharge),
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