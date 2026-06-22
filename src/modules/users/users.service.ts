import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email.toLowerCase().trim());
  }

  async findByIdOrThrow(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(email: string, passwordHash: string, displayName: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.usersRepository.findByEmail(normalizedEmail);
    if (existing) throw new ConflictException('Email already exists');
    return this.usersRepository.create({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
    });
  }
}
