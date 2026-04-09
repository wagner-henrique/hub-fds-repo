import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { BookingStatus } from "@prisma/client";
import { z } from "zod";

const updateBookingSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional().nullable(),
  room: z.enum(["reuniao", "treinamento", "coworking", "arapiraca", "sala_arapiraca", "auditorio"]).optional(),
  date: z
    .string()
    .optional()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      message: "Formato de data inválido",
    }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(BookingStatus).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"]);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"]);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateBookingSchema.parse(body);

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.email !== undefined ? { email: parsed.email } : {}),
        ...(parsed.phone !== undefined ? { phone: parsed.phone } : {}),
        ...(parsed.room !== undefined ? { room: parsed.room } : {}),
        ...(parsed.date !== undefined ? { date: new Date(parsed.date) } : {}),
        ...(parsed.time !== undefined ? { time: parsed.time } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      },
    });
    
    return NextResponse.json(booking);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"]);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    await prisma.booking.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}