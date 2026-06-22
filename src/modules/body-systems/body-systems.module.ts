import { Module } from '@nestjs/common';
import { BodySystemsService } from './body-systems.service';
import { BodySystemsController } from './body-systems.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BodySystemsController],
  providers: [BodySystemsService],
  exports: [BodySystemsService],
})
export class BodySystemsModule {}
