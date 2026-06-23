import { Module } from '@nestjs/common';
import { FoodsModule } from '@/modules/foods/foods.module';
import { AdminFoodsController } from '@/modules/admin/foods/admin-foods.controller';
import { AdminFoodsService } from '@/modules/admin/foods/admin-foods.service';
import { AdminNutrientsModule } from '@/modules/admin/nutrients/nutrients.module';
import { AdminBodySystemsModule } from '@/modules/admin/body-systems/body-systems.module';

@Module({
  imports: [FoodsModule, AdminNutrientsModule, AdminBodySystemsModule],
  controllers: [AdminFoodsController],
  providers: [AdminFoodsService],
})
export class AdminModule {}
