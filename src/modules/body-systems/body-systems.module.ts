import { Module } from '@nestjs/common';
import { BodySystemsService } from '@/modules/body-systems/body-systems.service';
import { BodySystemsController } from '@/modules/body-systems/body-systems.controller';
import { PrismaModule } from '@/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BodySystemsController],
  providers: [BodySystemsService],
  exports: [BodySystemsService],
})
export class BodySystemsModule {}
