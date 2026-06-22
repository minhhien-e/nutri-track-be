import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function arg(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match?.slice(prefix.length);
}

async function main() {
  const email = arg('email')?.toLowerCase().trim();
  const password = arg('password');
  const displayName = arg('displayName')?.trim() || 'NutriTrack Admin';

  if (!email) throw new Error('Missing --email=admin@example.com');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const user = await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
    });
    console.log(`Promoted ${user.email} to ADMIN`);
    return;
  }

  if (!password) throw new Error('Missing --password=... for a new admin user');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created ADMIN user ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
