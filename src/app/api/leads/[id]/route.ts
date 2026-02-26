import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.lead.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Lead removido" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar lead" }, { status: 500 });
  }
}