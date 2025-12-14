import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsService } from '../../src/claims/claims.service';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('Historias: Reclamos (Registrar, Reasignar, Seguimiento, Cierre, Comentarios Internos)', () => {
  let service: ClaimsService;
  // Mocks de modelos Mongoose
  const claimModel: any = function(this: any, doc: any) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue({ _id: 'c1', ...doc });
  };
  claimModel.find = jest.fn().mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439013' }]) });
  claimModel.findById = jest.fn().mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439013', history: [] }) });
  claimModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'c1', priority: 'ALTA', criticality: 'MEDIA', user: 'u1' }) });
  claimModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) });

  const historyModel: any = function(this: any, doc: any) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue({ _id: 'h1', ...doc });
  };
  historyModel.findOne = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue({ claimStatus: 'PENDING', _id: 'hLast' }) });
  historyModel.find = jest.fn().mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([{ _id: 'h1', action: 'Creación del reclamo' }]) });
  historyModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'hLast' });

  const userModel: any = {};
  const projectModel: any = { findByIdAndUpdate: jest.fn().mockResolvedValue({}) };
  const areaModel: any = {};
  const subAreaModel: any = { findById: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue({ _id: 's1', name: 'Sub', area: { _id: 'a1', name: 'Area' } }) }) };
  const messageModel: any = function(this: any, doc: any) { Object.assign(this, doc); this.save = jest.fn().mockResolvedValue({ _id: 'm1', ...doc }); };
  messageModel.find = jest.fn().mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([{ _id: 'm1', content: 'interno' }]) });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        { provide: getModelToken('Claim'), useValue: claimModel },
        { provide: getModelToken('ClaimStateHistory'), useValue: historyModel },
        { provide: getModelToken('User'), useValue: userModel },
        { provide: getModelToken('Project'), useValue: projectModel },
        { provide: getModelToken('Area'), useValue: areaModel },
        { provide: getModelToken('SubArea'), useValue: subAreaModel },
        { provide: getModelToken('ClaimMessage'), useValue: messageModel },
      ],
    }).compile();
    service = module.get<ClaimsService>(ClaimsService);
  });

  beforeEach(() => jest.clearAllMocks());

  it('Registrar Reclamo: debe crear reclamo y primer historial', async () => {
    const res = await service.create({ description: 'd', claimType: 'BUG', priority: 'ALTA', criticality: 'MEDIA', project: '507f1f77bcf86cd799439012' } as any, '507f1f77bcf86cd799439011');
    expect(res._id).toBe('c1');
    expect(projectModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('Seguimiento del Reclamo (Cliente): debe listar reclamos con último estado y área', async () => {
    const res = await service.findAllForUser({ role: 'CUSTOMER', id: '507f1f77bcf86cd799439011' } as any);
    expect(res[0].claimStatus).toBeDefined();
  });

  it('Reasignar Reclamo: al actualizar con subarea válida registra historial y snapshot de área', async () => {
    const updated = await service.updateWithHistory('507f1f77bcf86cd799439013', { claimStatus: 'IN_PROGRESS', subarea: '507f1f77bcf86cd799439014' } as any);
    expect(updated.claimStatus).toBe('IN_PROGRESS');
    expect((updated as any).area?.name).toBe('Area');
  });

  it('Cierre de Reclamo: no debe permitir actualizar si último historial es RESOLVED', async () => {
    historyModel.findOne = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue({ claimStatus: 'RESOLVED', _id: 'hLast' }) });
    await expect(service.updateWithHistory('507f1f77bcf86cd799439013', { claimStatus: 'IN_PROGRESS' } as any)).rejects.toBeInstanceOf(ConflictException);
  });

  it('Comentarios Internos: debe crear mensaje con estado PRIVADO y listar', async () => {
    const msg = await service.postMessage('507f1f77bcf86cd799439013', { id: '507f1f77bcf86cd799439011' } as any, { content: 'interno', state: 'PRIVADO' });
    expect(msg._id).toBe('m1');
    const msgs = await service.getMessages('507f1f77bcf86cd799439013');
    expect(msgs[0].content).toBe('interno');
  });

  it('Actualizar Reclamo: debe validar project inválido y arrojar BadRequest', async () => {
    // Asegurar que el último historial NO esté RESOLVED para alcanzar la validación de project
    historyModel.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ claimStatus: 'PENDING', _id: 'hLast' }),
    });
    await expect(
      service.updateWithHistory('507f1f77bcf86cd799439013', { project: 'invalid' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
