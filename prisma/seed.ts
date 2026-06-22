import { PrismaClient, UserRole, Gender, ActivityLevel, Goal } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin account...');

  const adminEmail = 'admin@nutritrack.com';
  
  // Create admin if not exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const newAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: '$2b$10$w/y5K7cOIfU3G5U.e8Q7IulU/o8GzZzC1Qd2s1t/m7ZzM6n7eXQ2e', // Represents 'password'
        displayName: 'Administrator',
        role: UserRole.ADMIN,
      }
    });

    await prisma.userProfile.create({
      data: {
        userId: newAdmin.id,
        age: 30,
        gender: Gender.male,
        heightCm: 170,
        weightKg: 70,
        activityLevel: ActivityLevel.moderatelyActive,
        goal: Goal.maintainWeight,
      }
    });
    console.log('Admin account created: admin@nutritrack.com / password');
  } else {
    // Ensure role is admin
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { role: UserRole.ADMIN }
    });
    console.log('Admin account already exists.');
  }

  console.log('Seed completed successfully. Foods, Body Systems, and Nutrients should be managed via the Admin Dashboard.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
