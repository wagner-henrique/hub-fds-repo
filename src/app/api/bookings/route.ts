import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const bookings = await prisma.booking.findMany({
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, date, time } = body;

  const booking = await prisma.booking.create({
    data: {
      name,
      email,
      date: new Date(date),
      time,
    },
  });

  return NextResponse.json(booking);
}