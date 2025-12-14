import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('Historia: Iniciar Sesión', () => {
  let authService: AuthService;
  const usersServiceMock = {
    findByEmailWithPassword: jest.fn(),
    findByEmail: jest.fn(),
  } as unknown as UsersService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe iniciar sesión con credenciales válidas y devolver tokens', async () => {
    usersServiceMock.findByEmailWithPassword = jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      password: await bcrypt.hash('secret', 10),
    });

    const result = await authService.login({ email: 'john@doe.com', password: 'secret' });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.email).toBe('john@doe.com');
  });

  it('debe fallar si el usuario no existe', async () => {
    usersServiceMock.findByEmailWithPassword = jest.fn().mockResolvedValue(null);
    await expect(
      authService.login({ email: 'missing@user.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('debe fallar si la contraseña es incorrecta', async () => {
    usersServiceMock.findByEmailWithPassword = jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      password: await bcrypt.hash('secret', 10),
    });
    await expect(
      authService.login({ email: 'john@doe.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('debe refrescar token si refresh es válido', async () => {
    usersServiceMock.findByEmail = jest.fn().mockResolvedValue({
      _id: 'u1',
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
    });
    // generar refresh desde el propio servicio
    const payload = { id: 'u1', role: 'CUSTOMER', email: 'john@doe.com', firstName: 'John', lastName: 'Doe' } as any;
    const refresh = authService.generateToken(payload, 'refresh');
    const res = await authService.refreshToken(refresh);
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
  });
});
