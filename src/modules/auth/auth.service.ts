import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser(dto.email, passwordHash, dto.displayName);
    return this.createSession(user.id, user.email, user.displayName, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValidPassword) throw new UnauthorizedException('Invalid email or password');
    return this.createSession(user.id, user.email, user.displayName, user.role);
  }

  async me(userId: string) {
    const user = await this.usersService.findByIdOrThrow(userId);
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, createdAt: user.createdAt };
  }

  private createSession(userId: string, email: string, displayName: string, role: string) {
    const expiresIn = this.configService.get<string>('jwt.expiresIn') ?? '7d';
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      { expiresIn: expiresIn as never },
    );
    return {
      accessToken,
      user: { id: userId, email, displayName, role },
    };
  }
}
