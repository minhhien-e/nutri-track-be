import { Module } from '@nestjs/common';
import { FoodsModule } from '../foods/foods.module';
import { AdminFoodsController } from './foods/admin-foods.controller';
import { AdminFoodsService } from './foods/admin-foods.service';
import { AdminNutrientsModule } from './nutrients/nutrients.module';
import { AdminBodySystemsModule } from './body-systems/body-systems.module';

@Module({
  imports: [FoodsModule, AdminNutrientsModule, AdminBodySystemsModule],
  controllers: [AdminFoodsController],
  providers: [AdminFoodsService],
})
export class AdminModule {}
