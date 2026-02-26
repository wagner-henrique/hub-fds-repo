import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpar dados existentes
  await prisma.booking.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.setting.deleteMany();

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

  // Configurações iniciais
  await prisma.setting.create({
    data: {
      key: "hub_name",
      value: "HUB FDS - Fábrica de Sonhos"
    }
  });

  console.log("Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });