import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kaarya.com' },
    update: {},
    create: {
      email: 'admin@kaarya.com',
      name: 'System Admin',
      password,
      role: 'ADMIN',
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@kaarya.com' },
    update: {},
    create: {
      email: 'sales@kaarya.com',
      name: 'Sales Rep',
      password,
      role: 'SALES',
    },
  });

  const warehouse = await prisma.user.upsert({
    where: { email: 'warehouse@kaarya.com' },
    update: {},
    create: {
      email: 'warehouse@kaarya.com',
      name: 'Warehouse Manager',
      password,
      role: 'WAREHOUSE',
    },
  });

  const accounts = await prisma.user.upsert({
    where: { email: 'accounts@kaarya.com' },
    update: {},
    create: {
      email: 'accounts@kaarya.com',
      name: 'Accountant',
      password,
      role: 'ACCOUNTS',
    },
  });

  console.log({ admin, sales, warehouse, accounts });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
