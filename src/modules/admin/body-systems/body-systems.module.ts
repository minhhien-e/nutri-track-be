import { Module } from '@nestjs/common';
import { AdminBodySystemsService } from './body-systems.service';
import { AdminBodySystemsController } from './body-systems.controller';
import { PrismaModule } from '../../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminBodySystemsController],
  providers: [AdminBodySystemsService],
  exports: [AdminBodySystemsService],
})
export class AdminBodySystemsModule {}
