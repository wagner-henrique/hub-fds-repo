import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, date, time, status } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;
    if (status) updateData.status = status;

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: "Falha ao atualizar o registro" }, { status: 500 });
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

    return NextResponse.json({ message: "Registro removido do banco de dados" });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao deletar o registro" }, { status: 500 });
  }
}