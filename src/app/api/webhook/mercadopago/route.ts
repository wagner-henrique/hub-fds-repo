import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPaymentById } from "@/lib/mercadopago"
import { BookingStatus } from "@prisma/client"
import crypto from "node:crypto"
import { applyRateLimit } from "@/lib/rate-limit"

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

function upsertTag(notes: string | null | undefined, tag: string, value: string) {
  const safeNotes = notes?.trim() ?? ""
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`\\[${escapedTag}:[^\\]]*\\]`, "g")
  const nextTag = `[${tag}:${value}]`

  if (pattern.test(safeNotes)) {
    return safeNotes.replace(pattern, nextTag).trim()
  }

  return [safeNotes, nextTag].filter(Boolean).join(" ").trim()
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export async function POST(request: Request) {
  try {
    const rateLimit = applyRateLimit(request, "webhook-mercadopago", { max: 120, windowMs: 60_000 })
    if (!rateLimit.ok) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em instantes." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }

    const url = new URL(request.url)
    const expectedSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    const providedSecret = request.headers.get("x-webhook-secret")

    if (!expectedSecret) {
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 503 })
    }

    if (!providedSecret || !safeEqual(expectedSecret, providedSecret)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const payload = await request.json().catch(() => ({}))

    const type = (url.searchParams.get("type") || payload?.type || payload?.action || "").toString()
    const dataId =
      url.searchParams.get("data.id") ||
      payload?.data?.id ||
      payload?.resource?.split("/").pop()

    if (!dataId || !type.toLowerCase().includes("payment")) {
      return NextResponse.json({ received: true })
    }

    const payment = await getPaymentById(dataId)
    const bookingId = payment.external_reference

    if (!bookingId) {
      return NextResponse.json({ received: true })
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { notes: true },
    })

    if (!existingBooking) {
      return NextResponse.json({ received: true })
    }

    let nextBookingStatus: BookingStatus = BookingStatus.PENDING
    if (payment.status === "approved") {
      nextBookingStatus = BookingStatus.CONFIRMED
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      nextBookingStatus = BookingStatus.CANCELLED
    }

    const transactionAmount = Number(payment.transaction_amount)
    const paidAmount = Number.isFinite(transactionAmount) ? roundMoney(transactionAmount) : null
    const fullAmount = parseTaggedNumber(existingBooking.notes, "Payment_Full")
    const currentCoverage = parseTaggedInteger(existingBooking.notes, "Payment_Coverage")

    const inferredCoverage =
      currentCoverage === 50 || currentCoverage === 100
        ? currentCoverage
        : fullAmount !== null && paidAmount !== null && fullAmount > 0 && paidAmount >= fullAmount
          ? 100
          : 50

    const safeFullAmount = fullAmount !== null ? roundMoney(fullAmount) : paidAmount ?? 0
    const safePaidAmount = paidAmount ?? parseTaggedNumber(existingBooking.notes, "Payment_Paid") ?? 0
    const remainingAmount = roundMoney(Math.max(safeFullAmount - safePaidAmount, 0))

    let nextNotes = existingBooking.notes

    if (payment.status === "approved") {
      nextNotes = upsertTag(nextNotes, "Payment_MP_Confirmed", "1")
      nextNotes = upsertTag(nextNotes, "Payment_Coverage", String(inferredCoverage))
      nextNotes = upsertTag(nextNotes, "Payment_Full", safeFullAmount.toFixed(2))
      nextNotes = upsertTag(nextNotes, "Payment_Paid", roundMoney(safePaidAmount).toFixed(2))
      nextNotes = upsertTag(nextNotes, "Payment_Remaining", remainingAmount.toFixed(2))
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      nextNotes = upsertTag(nextNotes, "Payment_MP_Confirmed", "0")
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: nextBookingStatus,
        notes: nextNotes,
      },
    })

    if (nextBookingStatus === BookingStatus.CONFIRMED) {
      const n8nWebhookUrl = process.env.N8N_PAYMENT_CONFIRMATION_URL
      
      if (n8nWebhookUrl) {
        try {
          const dateStr = updatedBooking.date 
            ? new Date(updatedBooking.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
            : ''

          const idReservaMatch = updatedBooking.notes?.match(/\[ID_Reserva:([^\]]+)\]/)
          const idReservaCurto = idReservaMatch ? idReservaMatch[1] : bookingId

          await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: updatedBooking.phone,
              name: updatedBooking.name,
              room: updatedBooking.room,
              date: dateStr,
              time: updatedBooking.time,
              idReserva: idReservaCurto
            }),
          })
          
          console.log("Notificação de confirmação enviada ao n8n com sucesso.")
        } catch (notifyError) {
          console.error("Erro ao notificar o n8n sobre o pagamento:", notifyError)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erro no processamento do webhook do Mercado Pago:", error)
    return NextResponse.json({ received: true })
  }
}