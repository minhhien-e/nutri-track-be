import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: CurrentUser }>();
    if (request.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
