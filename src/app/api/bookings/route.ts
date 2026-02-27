import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations";
import { createBookingPreference } from "@/lib/mercadopago";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: limit,
        orderBy: { date: "asc" },
      }),
      prisma.booking.count(),
    ]);

    return NextResponse.json({
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    const bookingDate = new Date(validatedData.date);
    bookingDate.setUTCHours(0, 0, 0, 0);

    const existingBooking = await prisma.booking.findFirst({
      where: {
        date: bookingDate,
        time: validatedData.time,
        status: {
          in: ["confirmed", "pending_payment"]
        }
      }
    });

    if (existingBooking) {
      return NextResponse.json({ error: "Horário indisponível" }, { status: 409 });
    }

    const booking = await prisma.booking.create({
      data: {
        ...validatedData,
        date: bookingDate,
        status: "pending_payment"
      },
    });

    const unitPrice = 50.00; 

    const checkoutUrl = await createBookingPreference(
      booking.id,
      booking.name,
      booking.email,
      unitPrice
    );

    return NextResponse.json({ booking, checkoutUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process booking" }, { status: 500 });
  }
}