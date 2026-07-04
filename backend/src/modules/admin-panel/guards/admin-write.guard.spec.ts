import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from 'src/modules/admin-users/enums/roles.enum';
import { AdminWriteAction } from '../decorators/admin-write.decorator';
import { AdminWriteGuard } from '../guards/admin-write.guard';

describe('AdminWriteGuard', () => {
  const reflector = new Reflector();
  const guard = new AdminWriteGuard(reflector);

  const createContext = (role: AdminRole, action?: AdminWriteAction) => {
    const handler = action ? { action } : {};
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(action);
    return {
      getHandler: () => handler,
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role } }),
      }),
    } as never;
  };

  it('blocks READONLY write actions', () => {
    expect(() =>
      guard.canActivate(createContext(AdminRole.READONLY, AdminWriteAction.BLOCK_USER)),
    ).toThrow(ForbiddenException);
  });

  it('allows SUPPORT to manage connections', () => {
    expect(
      guard.canActivate(
        createContext(AdminRole.SUPPORT, AdminWriteAction.MANAGE_CONNECTION),
      ),
    ).toBe(true);
  });

  it('blocks COMPLIANCE from blocking users', () => {
    expect(() =>
      guard.canActivate(createContext(AdminRole.COMPLIANCE, AdminWriteAction.BLOCK_USER)),
    ).toThrow(ForbiddenException);
  });

  it('allows SUPER_ADMIN to change user role', () => {
    expect(
      guard.canActivate(
        createContext(AdminRole.SUPER_ADMIN, AdminWriteAction.CHANGE_USER_ROLE),
      ),
    ).toBe(true);
  });
});
