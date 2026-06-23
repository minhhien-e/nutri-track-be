import { Module } from '@nestjs/common';
import { AdminNutrientsService } from '@/modules/admin/nutrients/nutrients.service';
import { AdminNutrientsController } from '@/modules/admin/nutrients/nutrients.controller';
import { PrismaModule } from '@/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminNutrientsController],
  providers: [AdminNutrientsService],
  exports: [AdminNutrientsService],
})
export class AdminNutrientsModule {}
