import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    
    const booking = await prisma.booking.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json(booking);
  } catch (error) {
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