import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPaymentById } from "@/lib/mercadopago"
import { BookingStatus } from "@prisma/client"
import crypto from "node:crypto"
import { applyRateLimit } from "@/lib/rate-limit"

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

    let nextBookingStatus: BookingStatus = BookingStatus.PENDING
    if (payment.status === "approved") {
      nextBookingStatus = BookingStatus.CONFIRMED
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      nextBookingStatus = BookingStatus.CANCELLED
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: nextBookingStatus },
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