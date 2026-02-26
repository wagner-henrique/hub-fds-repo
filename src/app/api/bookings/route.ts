import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, date, time } = body;

    if (!name || !email || !phone || !date || !time) {
      return NextResponse.json({ error: "Carga de dados incompleta" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        name,
        email,
        phone,
        date: new Date(date),
        time,
        status: "pending"
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha na persistência de dados" }, { status: 500 });
  }
}