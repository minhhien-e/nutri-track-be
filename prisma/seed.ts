import { FoodSource, PrismaClient, NutrientCategory } from '@prisma/client';

const prisma = new PrismaClient();

type SeedFood = {
  id: string;
  name: string;
  servingSizeG: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  totalFatPer100g: number;
  imageAssetPath: string;
  category: string;
  displayTag: string;
  nutrients: { name: string; amountPer100g: number }[];
};

const foods: SeedFood[] = [
  {
    id: 'chicken-breast',
    name: 'Ức gà luộc',
    servingSizeG: 100,
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    totalFatPer100g: 3.6,
    imageAssetPath: 'assets/images/food_chicken.png',
    category: 'Đạm nạc',
    displayTag: 'Giàu protein',
    nutrients: [
      { name: 'Magie', amountPer100g: 29 },
      { name: 'Kali', amountPer100g: 256 },
      { name: 'Kẽm', amountPer100g: 1.0 },
    ],
  },
  {
    id: 'salmon-salad',
    name: 'Salad cá hồi',
    servingSizeG: 180,
    caloriesPer100g: 142,
    proteinPer100g: 13,
    carbsPer100g: 4,
    totalFatPer100g: 8,
    imageAssetPath: 'assets/images/food_salad.png',
    category: 'Cân bằng',
    displayTag: 'Omega-3',
    nutrients: [
      { name: 'Vitamin D', amountPer100g: 400 },
      { name: 'Iốt', amountPer100g: 15 },
      { name: 'Vitamin C', amountPer100g: 10 },
      { name: 'Omega-3', amountPer100g: 1.2 },
    ],
  },
  {
    id: 'sweet-potato',
    name: 'Khoai lang',
    servingSizeG: 100,
    caloriesPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 20,
    totalFatPer100g: 0.1,
    imageAssetPath: 'assets/images/food_bowl.png',
    category: 'Tinh bột',
    displayTag: 'Nhiều xơ',
    nutrients: [
      { name: 'Vitamin A', amountPer100g: 709 },
      { name: 'Vitamin C', amountPer100g: 2.4 },
      { name: 'Canxi', amountPer100g: 30 },
    ],
  },
];

async function main() {
  console.log('Seeding body systems...');
  const muscularSystem = await prisma.bodySystem.upsert({
    where: { name: 'Hệ cơ bắp' },
    update: {},
    create: { name: 'Hệ cơ bắp', description: 'Chịu trách nhiệm cho chuyển động và tăng cơ.' },
  });

  const endocrineSystem = await prisma.bodySystem.upsert({
    where: { name: 'Hệ nội tiết' },
    update: {},
    create: { name: 'Hệ nội tiết', description: 'Điều hòa hormone, ảnh hưởng lớn đến quá trình đốt mỡ.' },
  });

  const skeletalSystem = await prisma.bodySystem.upsert({
    where: { name: 'Hệ xương khớp' },
    update: {},
    create: { name: 'Hệ xương khớp', description: 'Hỗ trợ cấu trúc cơ thể và bảo vệ cơ quan nội tạng.' },
  });

  const immuneSystem = await prisma.bodySystem.upsert({
    where: { name: 'Hệ miễn dịch' },
    update: {},
    create: { name: 'Hệ miễn dịch', description: 'Bảo vệ cơ thể khỏi bệnh tật.' },
  });

  console.log('Seeding nutrients...');
  const nutrientsData = [
    { name: 'Vitamin C', unit: 'mg', category: NutrientCategory.vitamin, defaultDailyTarget: 90 },
    { name: 'Canxi', unit: 'mg', category: NutrientCategory.mineral, defaultDailyTarget: 1000 },
    { name: 'Magie', unit: 'mg', category: NutrientCategory.mineral, defaultDailyTarget: 400 },
    { name: 'Kẽm', unit: 'mg', category: NutrientCategory.mineral, defaultDailyTarget: 11 },
    { name: 'Iốt', unit: 'mcg', category: NutrientCategory.mineral, defaultDailyTarget: 150 },
    { name: 'Vitamin D', unit: 'IU', category: NutrientCategory.vitamin, defaultDailyTarget: 600 },
    { name: 'Kali', unit: 'mg', category: NutrientCategory.mineral, defaultDailyTarget: 4700 },
    { name: 'Omega-3', unit: 'g', category: NutrientCategory.macro, defaultDailyTarget: 1.6 },
    { name: 'Vitamin A', unit: 'mcg', category: NutrientCategory.vitamin, defaultDailyTarget: 900 },
  ];

  const nutrientMap = new Map<string, string>();
  for (const n of nutrientsData) {
    const nutrient = await prisma.nutrient.upsert({
      where: { name: n.name },
      update: {},
      create: n,
    });
    nutrientMap.set(n.name, nutrient.id);
  }

  console.log('Mapping body systems to nutrients...');
  const systemNutrients = [
    { bodySystemId: muscularSystem.id, nutrientId: nutrientMap.get('Magie')!, impactLevel: 2 },
    { bodySystemId: muscularSystem.id, nutrientId: nutrientMap.get('Kali')!, impactLevel: 2 },
    { bodySystemId: endocrineSystem.id, nutrientId: nutrientMap.get('Iốt')!, impactLevel: 3 },
    { bodySystemId: endocrineSystem.id, nutrientId: nutrientMap.get('Kẽm')!, impactLevel: 2 },
    { bodySystemId: endocrineSystem.id, nutrientId: nutrientMap.get('Vitamin D')!, impactLevel: 2 },
    { bodySystemId: skeletalSystem.id, nutrientId: nutrientMap.get('Canxi')!, impactLevel: 3 },
    { bodySystemId: skeletalSystem.id, nutrientId: nutrientMap.get('Vitamin D')!, impactLevel: 2 },
    { bodySystemId: immuneSystem.id, nutrientId: nutrientMap.get('Vitamin C')!, impactLevel: 3 },
    { bodySystemId: immuneSystem.id, nutrientId: nutrientMap.get('Kẽm')!, impactLevel: 2 },
  ];

  for (const sn of systemNutrients) {
    await prisma.bodySystemNutrient.upsert({
      where: {
        bodySystemId_nutrientId: {
          bodySystemId: sn.bodySystemId,
          nutrientId: sn.nutrientId,
        },
      },
      update: { impactLevel: sn.impactLevel },
      create: sn,
    });
  }

  console.log('Seeding foods and mapping nutrients...');
  for (const food of foods) {
    const { nutrients, ...foodData } = food;
    const foodItem = await prisma.foodItem.upsert({
      where: { id: food.id },
      update: {
        ...foodData,
        fatPer100g: food.totalFatPer100g,
        transFatPer100g: 0,
        source: FoodSource.adminCatalog,
        isActive: true,
      },
      create: {
        ...foodData,
        fatPer100g: food.totalFatPer100g,
        transFatPer100g: 0,
        source: FoodSource.adminCatalog,
        isActive: true,
      },
    });

    for (const n of nutrients) {
      const nutrientId = nutrientMap.get(n.name);
      if (nutrientId) {
        await prisma.foodNutrient.upsert({
          where: {
            foodItemId_nutrientId: {
              foodItemId: foodItem.id,
              nutrientId: nutrientId,
            },
          },
          update: { amountPer100g: n.amountPer100g },
          create: {
            foodItemId: foodItem.id,
            nutrientId: nutrientId,
            amountPer100g: n.amountPer100g,
          },
        });
      }
    }
  }
  console.log('Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
