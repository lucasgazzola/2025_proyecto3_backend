import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (behavior)', () => {
  let controller: AuthController;
  const serviceMock: Partial<AuthService> = {
    register: jest.fn().mockResolvedValue({ id: 'u1', email: 'a@b.com' }),
    login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
    logout: jest.fn().mockReturnValue({ message: 'Logged out' }),
    refreshToken: jest.fn().mockResolvedValue({ accessToken: 'na', refreshToken: 'nr' }),
    sendPasswordResetEmail: jest.fn(),
    validateToken: jest.fn().mockResolvedValue({ valid: true }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('register llama servicio y retorna usuario', async () => {
    const res = await controller.register({} as any);
    expect(res).toHaveProperty('email');
  });

  it('login retorna tokens', async () => {
    const res = await controller.login({} as any);
    expect(res).toHaveProperty('accessToken');
  });

  it('logout retorna mensaje', () => {
    expect(controller.logout()).toEqual({ message: 'Logged out' });
  });

  it('refresh retorna nuevos tokens', async () => {
    const res = await controller.refresh('rt');
    expect(res).toHaveProperty('accessToken');
  });

  it('validateToken retorna válido', async () => {
    const res = await controller.validateToken('t');
    expect(res).toEqual({ valid: true });
  });
});
