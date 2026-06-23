import { Module } from '@nestjs/common';
import { AdminBodySystemsService } from '@/modules/admin/body-systems/body-systems.service';
import { AdminBodySystemsController } from '@/modules/admin/body-systems/body-systems.controller';
import { PrismaModule } from '@/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminBodySystemsController],
  providers: [AdminBodySystemsService],
  exports: [AdminBodySystemsService],
})
export class AdminBodySystemsModule {}
