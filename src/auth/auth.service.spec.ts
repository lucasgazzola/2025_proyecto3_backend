import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from './dto/login.dto';
import { validate } from 'class-validator';
// Mock bcrypt at module level to avoid spyOn errors on non-configurable properties
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(async () => 'hashed'),
}));
const bcrypt: any = require('bcrypt');
import { Role } from '../common/enums/roles.enums';

describe('AuthService (unit)', () => {
  let authService: AuthService;
  const mockUsersService: any = {
    findByEmailWithPassword: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    // Restore any spies/mocks to avoid 'Cannot redefine property' errors
    jest.restoreAllMocks();
    jest.clearAllMocks();
    authService = new AuthService(
      mockUsersService,
    );
  });

  describe('DTO validation (class-validator)', () => {
    it('When (1) email empty -> validation message "El email no puede estar vacío"', async () => {
      const dto = new LoginAuthDto();
      dto.email = '';
      dto.password = 'validpass';

      const errors = await validate(dto);
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      expect(messages).toContain('El email no puede estar vacío');
    });

    it('When (2) password empty -> validation message "La contraseña no puede estar vacía"', async () => {
      const dto = new LoginAuthDto();
      dto.email = 'user@example.com';
      dto.password = '';

      const errors = await validate(dto);
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      expect(messages).toContain('La contraseña no puede estar vacía');
    });

    it('When (3) invalid email format -> validation message "El formato del email no es válido"', async () => {
      const dto = new LoginAuthDto();
      dto.email = 'usuario@correo';
      dto.password = 'validpass';

      const errors = await validate(dto);
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      expect(messages).toContain('El formato del email no es válido');
    });
  });

  describe('AuthService.login behavior', () => {
    beforeEach(() => {
      // default: no user found
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);
    });

    it('When (4) valid format but incorrect credentials -> throws UnauthorizedException with "Invalid credentials"', async () => {
      const dto = new LoginAuthDto();
      dto.email = 'valid@example.com';
      dto.password = 'wrongpass';

      // Simulate user exists
      const user = {
        id: 1,
        email: dto.email,
        password: 'hashed',
        role: Role.USER,
      };
      mockUsersService.findByEmailWithPassword.mockResolvedValue(user);

      // Mock bcrypt.compare to return false for wrongpass
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (pass: string) => pass === 'correctpass');

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(dto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('When (5) valid credentials -> returns tokens', async () => {
      const dto = new LoginAuthDto();
      dto.email = 'valid@example.com';
      dto.password = 'correctpass';

      const user = {
        id: 2,
        email: dto.email,
        password: 'hashed',
        role: Role.USER,
      };
      mockUsersService.findByEmailWithPassword.mockResolvedValue(user);

      // Mock bcrypt.compare to return true for correctpass
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (pass: string) => pass === 'correctpass');

      const result = await authService.login(dto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('AuthService.register behavior', () => {
    it('When (1) all fields empty -> returns required field messages', async () => {
      const dto = new (require('./dto/register.dto').RegisterAuthDto)();
      dto.email = '';
      dto.firstName = '';
      dto.lastName = '';
      dto.password = '';
      dto.confirmPassword = '';

      const errors = await validate(dto);
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      // Expect that there are messages for required fields
      expect(messages).toContain('El email no puede estar vacío');
      expect(messages).toContain('El nombre no puede estar vacío');
      expect(messages).toContain('El apellido no puede estar vacío');
      expect(messages).toContain('La contraseña no puede estar vacía');
      expect(messages).toContain(
        'La confirmación de contraseña no puede estar vacía',
      );
    });

    it('When (2) email already exists -> throws "Email already registered"', async () => {
      const RegisterDto = require('./dto/register.dto').RegisterAuthDto;
      const dto = new RegisterDto();
      dto.email = 'exist@example.com';
      dto.firstName = 'Nombre';
      dto.lastName = 'Apellido';
      dto.password = 'Abc123';
      dto.confirmPassword = 'Abc123';

      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        email: dto.email,
      });

      await expect(authService.register(dto)).rejects.toThrow(
        'Email already registered',
      );
    });

    it('When (3) invalid email format -> returns "Correo electrónico inválido"', async () => {
      const RegisterDto = require('./dto/register.dto').RegisterAuthDto;
      const dto = new RegisterDto();
      dto.email = 'bademail';
      dto.firstName = 'Nombre';
      dto.lastName = 'Apellido';
      dto.password = 'Abc123';
      dto.confirmPassword = 'Abc123';

      const errors = await validate(dto);
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      expect(messages).toContain('Correo electrónico inválido');
    });

    it('When (4) password less than 6 chars -> returns "La contraseña debe tener al menos 6 caracteres"', async () => {
      const RegisterDto = require('./dto/register.dto').RegisterAuthDto;
      const dto = new RegisterDto();
      dto.email = 'user@example.com';
      dto.firstName = 'Nombre';
      dto.lastName = 'Apellido';
      dto.password = 'Ab1';
      dto.confirmPassword = 'Ab1';

      const errors = await validate(dto);
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      expect(messages).toContain(
        'La contraseña debe tener al menos 6 caracteres',
      );
    });

    it('When (5) password missing uppercase/lowercase/number -> returns "La contraseña no cumple los requisitos de seguridad"', async () => {
      const RegisterDto = require('./dto/register.dto').RegisterAuthDto;
      const dto = new RegisterDto();
      dto.email = 'user@example.com';
      dto.firstName = 'Nombre';
      dto.lastName = 'Apellido';
      dto.password = 'abcdef';
      dto.confirmPassword = 'abcdef';

      const errors = await validate(dto);
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      expect(messages).toContain(
        'La contraseña no cumple los requisitos de seguridad',
      );
    });

    it('When (6) password and confirmation different -> throws "Passwords do not match"', async () => {
      const RegisterDto = require('./dto/register.dto').RegisterAuthDto;
      const dto = new RegisterDto();
      dto.email = 'new@example.com';
      dto.firstName = 'Nombre';
      dto.lastName = 'Apellido';
      dto.password = 'Abc123';
      dto.confirmPassword = 'Xyz123';

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.register(dto)).rejects.toThrow(
        'Passwords do not match',
      );
    });

    it('When (7) valid registration -> creates user', async () => {
      const RegisterDto = require('./dto/register.dto').RegisterAuthDto;
      const dto = new RegisterDto();
      dto.email = 'ok@example.com';
      dto.firstName = 'Nombre';
      dto.lastName = 'Apellido';
      dto.password = 'Abc123';
      dto.confirmPassword = 'Abc123';

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: 10,
        email: dto.email,
        password: 'hashed',
      });

      const result = await authService.register(dto);
      expect(result).toHaveProperty('email', dto.email);
    });
  });
});
