import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { USER_REPOSITORY } from '../../src/users/repositories/user.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('Historia: Gestionar Usuarios (CRUD)', () => {
  let service: UsersService;
  const repo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: repo },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => jest.clearAllMocks());

  it('crear: debe asignar CUSTOMER por defecto cuando no envían rol', async () => {
    repo.create.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'CUSTOMER' });
    const res = await service.create({ email: 'a@b.com', firstName: 'A', lastName: 'B', password: 'x' } as any) as any;
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'CUSTOMER' }));
    expect(res?.role).toBe('CUSTOMER');
  });

  it('ver: debe devolver lista de usuarios', async () => {
    repo.findAll.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    const res = await service.findAll();
    expect(res).toHaveLength(2);
  });

  it('editar: debe actualizar y retornar usuario, y lanzar NotFound si no existe', async () => {
    repo.update.mockResolvedValue({ id: 'u1', firstName: 'Nuevo' });
    const updated = await service.update('u1', { firstName: 'Nuevo' } as any);
    expect(updated.firstName).toBe('Nuevo');

    repo.update.mockResolvedValue(null);
    await expect(service.update('uX', { firstName: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('eliminar: debe llamar al repositorio y no arrojar', async () => {
    repo.delete.mockResolvedValue(undefined);
    await expect(service.remove('u1')).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith('u1');
  });
});
