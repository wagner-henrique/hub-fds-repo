import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Limpar dados existentes
    await prisma.booking.deleteMany();
    await prisma.lead.deleteMany();

    // Criar Agendamentos de teste
    await prisma.booking.createMany({
      data: [
        {
          name: "Ricardo Silva",
          email: "ricardo@exemplo.com",
          phone: "82999999999",
          date: new Date(),
          time: "09:00",
          status: "confirmed",
        },
        {
          name: "Mariana Costa",
          email: "mariana@exemplo.com",
          phone: "82888888888",
          date: new Date(),
          time: "14:00",
          status: "pending",
        }
      ]
    });

    // Criar Leads de teste
    await prisma.lead.createMany({
      data: [
        {
          name: "João Tech",
          email: "joao@startup.com",
          phone: "82777777777",
          source: "landing_page",
          status: "new",
        },
        {
          name: "Empresa Inovação",
          email: "contato@inovacao.com",
          source: "newsletter",
          status: "contacted",
        }
      ]
    });

    return NextResponse.json({ message: "Banco de dados populado com sucesso!" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao popular banco" }, { status: 500 });
  }
}