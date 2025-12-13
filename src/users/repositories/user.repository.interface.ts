import { CreateUserDto } from "../dto/create-user.dto";
import { UserDomain } from "../mappers/user.mongo.mapper";

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {

  create(data: CreateUserDto): Promise<unknown>;
  findAll(): Promise<UserDomain[]>;
  findById(id: string): Promise<UserDomain | null>;
  update(id: string, data: any): Promise<UserDomain | null>;
  delete(id: string): Promise<void>;
  findByEmail(email: string): Promise<UserDomain | null>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
}