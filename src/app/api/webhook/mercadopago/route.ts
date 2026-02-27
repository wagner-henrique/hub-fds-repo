import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Payment, MercadoPagoConfig } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN'
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("data.id") || url.searchParams.get("id");

    if (topic === "payment" && id) {
      const paymentClient = new Payment(client);
      const paymentData = await paymentClient.get({ id });

      if (paymentData.status === "approved" && paymentData.external_reference) {
        await prisma.booking.update({
          where: { id: paymentData.external_reference },
          data: { status: "confirmed" },
        });
      } else if (
        (paymentData.status === "rejected" || paymentData.status === "cancelled") && 
        paymentData.external_reference
      ) {
        await prisma.booking.update({
          where: { id: paymentData.external_reference },
          data: { status: "cancelled" },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}