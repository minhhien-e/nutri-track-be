import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminGuard } from '@/modules/auth/guards/admin.guard';

function contextWithRole(role?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as ExecutionContext;
}

describe('AdminGuard', () => {
  it('allows admin users', () => {
    expect(new AdminGuard().canActivate(contextWithRole(UserRole.ADMIN))).toBe(true);
  });

  it('rejects non-admin users', () => {
    expect(() => new AdminGuard().canActivate(contextWithRole(UserRole.USER))).toThrow(ForbiddenException);
  });
});
