import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../../src/dashboard/dashboard.controller';
import { DashboardService } from '../../src/dashboard/dashboard.service';

describe('Historia: Consultar Reportes (Dashboard)', () => {
  let controller: DashboardController;
  const serviceMock: Partial<DashboardService> = {
    findAll: jest.fn().mockResolvedValue([{ kpi: 'totalClaims', value: 10 }]),
    findOne: jest.fn().mockImplementation(async (id: number) => ({ id, kpi: 'sla', value: 95 })),
    create: jest.fn().mockResolvedValue('This action adds a new dashboard'),
    update: jest.fn().mockResolvedValue('This action updates a #1 dashboard'),
    remove: jest.fn().mockResolvedValue('This action removes a #1 dashboard'),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: serviceMock }],
    }).compile();
    controller = module.get<DashboardController>(DashboardController);
  });

  it('debe listar reportes y métricas', async () => {
    const res = await controller.findAll();
    expect(res[0]).toEqual({ kpi: 'totalClaims', value: 10 });
  });

  it('debe consultar un reporte por id', async () => {
    const res = await controller.findOne('1');
    expect(res).toEqual({ id: 1, kpi: 'sla', value: 95 });
  });

  it('debe permitir crear/actualizar/eliminar entradas de dashboard (mock)', async () => {
    expect(await controller.create({} as any)).toBeDefined();
    expect(await controller.update('1', {} as any)).toBeDefined();
    expect(await controller.remove('1')).toBeDefined();
  });
});
