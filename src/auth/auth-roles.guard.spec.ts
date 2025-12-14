import { JwtAuthGuard } from './auth-roles.guard';
import { AuthService } from './auth.service';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';

const makeContext = (headers: Record<string, string> = {}) => ({
  switchToHttp: () => ({ getRequest: () => ({ headers, user: undefined }) }),
  getHandler: () => ({}),
  getClass: () => ({}),
} as any);

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: Partial<AuthService>;
  let reflector: Partial<Reflector>;

  beforeEach(() => {
    authService = { getPayload: jest.fn().mockReturnValue({ id: 'u1' }) };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as any;
    guard = new JwtAuthGuard(authService as AuthService, reflector as Reflector);
  });

  it('permite acceso si es ruta pública', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const res = guard.canActivate(makeContext());
    expect(res).toBe(true);
  });

  it('lanza Unauthorized si no hay Authorization header', () => {
    expect(() => guard.canActivate(makeContext())).toThrow(UnauthorizedException);
  });

  it('lanza Unauthorized si formato es inválido', () => {
    const ctx = makeContext({ authorization: 'Token abc' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('setea req.user y permite acceso con Bearer válido', () => {
    const ctx = makeContext({ authorization: 'Bearer token' });
    const res = guard.canActivate(ctx);
    expect(res).toBe(true);
  });
});
