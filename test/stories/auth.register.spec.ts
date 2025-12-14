import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';

describe('Historia: Registrarse (POST /auth/register)', () => {
  let app: INestApplication;
  const usersServiceMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  } as unknown as UsersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe registrar usuario válido y devolver 201', async () => {
    (usersServiceMock.findByEmail as any) = jest.fn().mockResolvedValue(null);
    (usersServiceMock.create as any) = jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'new@example.com',
      firstName: 'Nombre',
      lastName: 'Apellido',
      role: 'CUSTOMER',
    });

    const dto = {
      email: 'new@example.com',
      firstName: 'Nombre',
      lastName: 'Apellido',
      password: 'Secret1',
      confirmPassword: 'Secret1',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('new@example.com');
    expect(res.body.role).toBe('CUSTOMER');
  });

  it('debe fallar si el correo ya está registrado (400)', async () => {
    (usersServiceMock.findByEmail as any) = jest.fn().mockResolvedValue({ id: 'u1', email: 'exist@example.com' });

    const dto = {
      email: 'exist@example.com',
      firstName: 'Nombre',
      lastName: 'Apellido',
      password: 'Secret1',
      confirmPassword: 'Secret1',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email already registered');
  });

  it('debe fallar si las contraseñas no coinciden (400)', async () => {
    (usersServiceMock.findByEmail as any) = jest.fn().mockResolvedValue(null);

    const dto = {
      email: 'new@example.com',
      firstName: 'Nombre',
      lastName: 'Apellido',
      password: 'Secret1',
      confirmPassword: 'Otra1',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Passwords do not match');
  });

  it('debe aplicar validaciones del DTO (email vacío produce 400 con mensajes)', async () => {
    const dto = {
      email: '',
      firstName: 'Nombre',
      lastName: 'Apellido',
      password: 'Secret1',
      confirmPassword: 'Secret1',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto);
    expect(res.status).toBe(400);
    // ValidationPipe devuelve array de mensajes; verificamos contenido esperado
    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message).toEqual(expect.arrayContaining(['El email no puede estar vacío']));
  });
});
