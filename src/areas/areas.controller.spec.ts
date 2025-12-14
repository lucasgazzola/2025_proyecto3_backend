import { Test, TestingModule } from '@nestjs/testing';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { JwtAuthGuard } from '../auth/auth-roles.guard';
import { AuthService } from '../auth/auth.service';
import { Reflector } from '@nestjs/core';

describe('AreasController', () => {
  let controller: AreasController;
  const serviceMock: Partial<AreasService> = {
    findAll: jest.fn().mockResolvedValue([{ _id: 'a1', name: 'Soporte' }]),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreasController],
      providers: [
        { provide: AreasService, useValue: serviceMock },
        { provide: AuthService, useValue: { getPayload: jest.fn().mockReturnValue({ id: 'u1' }) } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn().mockReturnValue(false) } },
        { provide: JwtAuthGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
      ],
    }).compile();
    controller = module.get<AreasController>(AreasController);
  });

  it('GET /areas retorna listado', async () => {
    const res = await controller.getAreas();
    expect(res[0].name).toBe('Soporte');
  });
});
