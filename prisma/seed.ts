import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
        status: "CONFIRMED",
      },
      {
        name: "Mariana Costa",
        email: "mariana@exemplo.com",
        phone: "82888888888",
        date: new Date(),
        time: "14:00",
        status: "PENDING",
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
        status: "NEW",
      },
      {
        name: "Empresa Inovação",
        email: "contato@inovacao.com",
        source: "newsletter",
        status: "CONTACTED",
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

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (adminEmail && (adminPassword || adminPasswordHash)) {
    const passwordHash = adminPasswordHash ?? await bcrypt.hash(adminPassword as string, 12);

    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        name: "Administrador",
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
      create: {
        name: "Administrador",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });
  }

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