import { Module } from '@nestjs/common';
import { UsersRepository } from '@/modules/users/users.repository';
import { UsersService } from '@/modules/users/users.service';

@Module({
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
