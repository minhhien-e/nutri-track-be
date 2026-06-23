const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = '$2b$10$u3yaxCfe5ro7iaqCafDJ7e.1kN08MZsHGqRRcDDOby5ZXNPufMjrW';
  await prisma.user.update({
    where: { email: 'admin@nutritrack.com' },
    data: { passwordHash: hash }
  });
  console.log('Password fixed in DB');
}

main().catch(console.error).finally(() => prisma.$disconnect());
