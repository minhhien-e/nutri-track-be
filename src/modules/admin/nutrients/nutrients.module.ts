import { Module } from '@nestjs/common';
import { AdminNutrientsService } from './nutrients.service';
import { AdminNutrientsController } from './nutrients.controller';
import { PrismaModule } from '../../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminNutrientsController],
  providers: [AdminNutrientsService],
  exports: [AdminNutrientsService],
})
export class AdminNutrientsModule {}
