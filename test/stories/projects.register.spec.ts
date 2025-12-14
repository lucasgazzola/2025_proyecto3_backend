import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from '../../src/projects/projects.service';
import { getModelToken } from '@nestjs/mongoose';

describe('Historia: Registrar Proyecto', () => {
  let service: ProjectsService;
  const projectModelMock = function(this: any, doc: any) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue({ _id: 'p1', ...doc });
  } as any;
  (projectModelMock as any).find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
  (projectModelMock as any).findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'p1' }) });
  (projectModelMock as any).findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'p1', deletedAt: new Date() }) });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getModelToken('Project'), useValue: projectModelMock },
      ],
    }).compile();
    service = module.get<ProjectsService>(ProjectsService);
  });

  beforeEach(() => jest.clearAllMocks());

  it('debe crear proyecto asociado al usuario', async () => {
    const res = await service.createForUser({ id: '507f1f77bcf86cd799439011' }, { title: 'T', description: 'D', projectType: 'SOFTWARE' } as any);
    expect(res._id).toBe('p1');
    expect((res as any).user).toBeDefined();
  });

  it('debe listar proyectos del cliente (filtrados por usuario)', async () => {
    (projectModelMock as any).find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ _id: 'p1', user: { _id: 'u1', email: 'a@b.com' }, claims: [] }]),
    });
    const res = await service.findAllForUser({ role: 'CUSTOMER', id: '507f1f77bcf86cd799439011' } as any);
    expect(res[0]._id).toBe('p1');
    expect(res[0].user.email).toBe('a@b.com');
  });

  it('debe hacer soft delete del proyecto', async () => {
    const res = await service.softDelete('p1');
    expect(res?.deletedAt).toBeInstanceOf(Date);
  });
});
