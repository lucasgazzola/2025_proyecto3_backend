import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USER_REPOSITORY} from './repositories/user.repository.interface';
import type { IUserRepository } from './repositories/user.repository.interface';
import { Role } from 'src/common/enums/roles.enums';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async create(createUserDto: CreateUserDto) {
    if (!createUserDto.role) {

      createUserDto.role = Role.CUSTOMER;
    }

    const session = await this.connection.startSession();

    try {
      const result = await session.withTransaction(async () => {
        return this.repository.create(createUserDto, session);

      });

      return result;

    } catch (error) { throw error; } finally { await session.endSession();  }   
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {

    const user = await this.repository.findById(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    const user = await this.repository.update(id, updateUserDto);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async remove(id: string) {

    await this.repository.delete(id);

  }

  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository.findByEmailWithPassword(email);
  }
}
