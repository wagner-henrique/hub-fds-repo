import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Limpar dados existentes
  await prisma.booking.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.setting.deleteMany();

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

  console.log("Seed finalizado sem dados mockados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });