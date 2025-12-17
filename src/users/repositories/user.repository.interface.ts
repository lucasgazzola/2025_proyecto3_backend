import { ClientSession } from "mongoose";
import { CreateUserDto } from "../dto/create-user.dto";
import { UserDomain } from "../mappers/user.mongo.mapper";

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {

  create(data: CreateUserDto, session?: ClientSession): Promise<unknown>;
  findAll(): Promise<UserDomain[]>;
  findById(id: string): Promise<UserDomain | null>;
  update(id: string, data: any): Promise<UserDomain | null>;
  delete(id: string): Promise<void>;
  findByEmail(email: string): Promise<UserDomain | null>;
  findByEmailWithPassword(email: string): Promise<any | null>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
}