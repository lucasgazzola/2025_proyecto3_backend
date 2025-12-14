import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth-roles.guard';
import { AuthService } from '../auth/auth.service';
import { Reflector } from '@nestjs/core';

describe('ClaimsController', () => {
  let controller: ClaimsController;
  const serviceMock: Partial<ClaimsService> = {
    create: jest.fn().mockResolvedValue({ _id: 'c1' }),
    findAllForUser: jest.fn().mockResolvedValue([{ _id: 'c1' }]),
    findOne: jest.fn().mockResolvedValue({ _id: 'c1' }),
    updateWithHistory: jest.fn().mockResolvedValue({ _id: 'c1', claimStatus: 'IN_PROGRESS' }),
    getHistory: jest.fn().mockResolvedValue([]),
    postMessage: jest.fn().mockResolvedValue({ _id: 'm1' }),
    getMessages: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue({}),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimsController],
      providers: [
        { provide: ClaimsService, useValue: serviceMock },
        { provide: AuthService, useValue: { getPayload: jest.fn().mockReturnValue({ id: 'u1', role: 'USER' }) } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn().mockReturnValue(false) } },
        { provide: JwtAuthGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
      ],
    }).compile();
    controller = module.get<ClaimsController>(ClaimsController);
  });

  it('create devuelve claim', async () => {
    const res = await controller.create({ id: 'u1' } as any, {} as any);
    expect(res).toHaveProperty('_id');
  });

  it('findAll retorna lista', async () => {
    const res = await controller.findAll({ id: 'u1' } as any);
    expect(res).toHaveLength(1);
  });

  it('update exige rol USER, sino Unauthorized', () => {
    expect(() =>
      controller.update({ role: 'CUSTOMER' } as any, 'c1', { claimStatus: 'IN_PROGRESS' } as any),
    ).toThrow(UnauthorizedException);
  });
});
