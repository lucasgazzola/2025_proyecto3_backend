import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USER_REPOSITORY} from './repositories/user.repository.interface';
import type { IUserRepository } from './repositories/user.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    return this.repository.create(createUserDto);
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

    const user = await this.repository.delete(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string) {
    // ensure password field is selectable: if schema uses select: false,
    // we include it explicitly; otherwise this returns the same as findByEmail
    return this.repository.findByEmailWithPassword(email);
  }
}
