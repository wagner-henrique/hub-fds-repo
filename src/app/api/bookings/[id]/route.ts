import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar agendamento" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.booking.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Agendamento removido" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar agendamento" }, { status: 500 });
  }
}