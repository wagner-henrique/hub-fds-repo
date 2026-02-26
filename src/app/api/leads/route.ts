import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lead = await prisma.lead.upsert({
      where: { email: body.email },
      update: { ...body },
      create: { ...body },
    });
    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao salvar lead" }, { status: 500 });
  }
}