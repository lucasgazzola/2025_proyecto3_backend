import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { USER_REPOSITORY } from '../users/repositories/user.repository.interface';

class MockMailService {
  sendMail() {
    return true;
  }
}

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmail: jest.fn(), findByEmailWithPassword: jest.fn(), create: jest.fn() } },
        { provide: USER_REPOSITORY, useValue: { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), update: jest.fn(), delete: jest.fn(), findByEmail: jest.fn(), findByEmailWithPassword: jest.fn() } },

      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
