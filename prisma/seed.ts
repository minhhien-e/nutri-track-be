import { FoodSource, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedFood = {
  id: string;
  name: string;
  servingSizeG: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  totalFatPer100g: number;
  saturatedFatPer100g?: number;
  omega3Per100g?: number;
  fiberPer100g?: number;
  imageAssetPath: string;
  category: string;
  displayTag: string;
};

const foods: SeedFood[] = [
  {
    id: 'rice',
    name: 'Cơm trắng',
    servingSizeG: 100,
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    totalFatPer100g: 0.3,
    saturatedFatPer100g: 0.1,
    fiberPer100g: 0.4,
    imageAssetPath: 'assets/images/food_rice.png',
    category: 'Tinh bột',
    displayTag: 'Món chính',
  },
  {
    id: 'chicken-breast',
    name: 'Ức gà luộc',
    servingSizeG: 100,
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    totalFatPer100g: 3.6,
    saturatedFatPer100g: 1,
    fiberPer100g: 0,
    imageAssetPath: 'assets/images/food_chicken.png',
    category: 'Đạm nạc',
    displayTag: 'Giàu protein',
  },
  {
    id: 'egg',
    name: 'Trứng gà',
    servingSizeG: 50,
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    totalFatPer100g: 11,
    saturatedFatPer100g: 3.3,
    omega3Per100g: 0.1,
    fiberPer100g: 0,
    imageAssetPath: 'assets/images/food_egg.png',
    category: 'Đạm',
    displayTag: 'Bữa sáng',
  },
  {
    id: 'banana',
    name: 'Chuối',
    servingSizeG: 100,
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 23,
    totalFatPer100g: 0.3,
    saturatedFatPer100g: 0.1,
    fiberPer100g: 2.6,
    imageAssetPath: 'assets/images/food_banana.png',
    category: 'Trái cây',
    displayTag: 'Ăn vặt',
  },
  {
    id: 'sweet-potato',
    name: 'Khoai lang',
    servingSizeG: 100,
    caloriesPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 20,
    totalFatPer100g: 0.1,
    fiberPer100g: 3,
    imageAssetPath: 'assets/images/food_bowl.png',
    category: 'Tinh bột',
    displayTag: 'Nhiều xơ',
  },
  {
    id: 'tofu',
    name: 'Đậu phụ',
    servingSizeG: 100,
    caloriesPer100g: 76,
    proteinPer100g: 8,
    carbsPer100g: 1.9,
    totalFatPer100g: 4.8,
    saturatedFatPer100g: 0.7,
    fiberPer100g: 0.3,
    imageAssetPath: 'assets/images/food_tofu.png',
    category: 'Đạm thực vật',
    displayTag: 'Chay',
  },
  {
    id: 'salmon-salad',
    name: 'Salad cá hồi',
    servingSizeG: 180,
    caloriesPer100g: 142,
    proteinPer100g: 13,
    carbsPer100g: 4,
    totalFatPer100g: 8,
    saturatedFatPer100g: 1.4,
    omega3Per100g: 1.2,
    fiberPer100g: 1.8,
    imageAssetPath: 'assets/images/food_salad.png',
    category: 'Cân bằng',
    displayTag: 'Omega-3',
  },
  {
    id: 'oatmeal-fruit',
    name: 'Yến mạch trái cây',
    servingSizeG: 220,
    caloriesPer100g: 118,
    proteinPer100g: 4.2,
    carbsPer100g: 21,
    totalFatPer100g: 2.1,
    saturatedFatPer100g: 0.4,
    fiberPer100g: 3.2,
    imageAssetPath: 'assets/images/food_bowl.png',
    category: 'Bữa sáng',
    displayTag: 'Nhiều xơ',
  },
  {
    id: 'beef-pho',
    name: 'Phở bò',
    servingSizeG: 450,
    caloriesPer100g: 92,
    proteinPer100g: 6.2,
    carbsPer100g: 12.8,
    totalFatPer100g: 2.1,
    saturatedFatPer100g: 0.8,
    fiberPer100g: 0.6,
    imageAssetPath: 'assets/images/food_soup.png',
    category: 'Món Việt',
    displayTag: 'Ấm bụng',
  },
  {
    id: 'greek-yogurt',
    name: 'Sữa chua Hy Lạp',
    servingSizeG: 150,
    caloriesPer100g: 97,
    proteinPer100g: 9,
    carbsPer100g: 3.6,
    totalFatPer100g: 5,
    saturatedFatPer100g: 3.1,
    fiberPer100g: 0,
    imageAssetPath: 'assets/images/food_bowl.png',
    category: 'Đạm',
    displayTag: 'Ít đường',
  },
  {
    id: 'mixed-nuts',
    name: 'Hạt tổng hợp',
    servingSizeG: 30,
    caloriesPer100g: 607,
    proteinPer100g: 20,
    carbsPer100g: 21,
    totalFatPer100g: 54,
    saturatedFatPer100g: 5,
    omega3Per100g: 0.6,
    fiberPer100g: 7,
    imageAssetPath: 'assets/images/food_bowl.png',
    category: 'Ăn vặt',
    displayTag: 'Chất béo tốt',
  },
  {
    id: 'brown-rice-chicken',
    name: 'Cơm gạo lứt ức gà',
    servingSizeG: 320,
    caloriesPer100g: 151,
    proteinPer100g: 12,
    carbsPer100g: 17,
    totalFatPer100g: 3.5,
    saturatedFatPer100g: 0.8,
    fiberPer100g: 2.2,
    imageAssetPath: 'assets/images/food_chicken.png',
    category: 'Cân bằng',
    displayTag: 'Meal prep',
  },
];

async function main() {
  for (const food of foods) {
    await prisma.foodItem.upsert({
      where: { id: food.id },
      update: {
        ...food,
        fatPer100g: food.totalFatPer100g,
        transFatPer100g: 0,
        source: FoodSource.adminCatalog,
        isActive: true,
      },
      create: {
        ...food,
        fatPer100g: food.totalFatPer100g,
        transFatPer100g: 0,
        source: FoodSource.adminCatalog,
        isActive: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
