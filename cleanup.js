const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  await prisma.foodItem.deleteMany({});
  await prisma.bodySystem.deleteMany({});
  await prisma.nutrient.deleteMany({});
  console.log('Cleared all foods, systems, and nutrients.');
}
clean().catch(console.error).finally(() => prisma.$disconnect());
