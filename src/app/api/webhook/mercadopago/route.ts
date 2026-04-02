import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPaymentById } from "@/lib/mercadopago"
import { BookingStatus } from "@prisma/client"
import crypto from "node:crypto"

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
    const url = new URL(request.url)
    const expectedSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    const providedSecret = request.headers.get("x-webhook-secret") || url.searchParams.get("secret")

    if (expectedSecret) {
      if (!providedSecret || !safeEqual(expectedSecret, providedSecret)) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
      }
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

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: nextBookingStatus },
    })

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ received: true })
  }
}