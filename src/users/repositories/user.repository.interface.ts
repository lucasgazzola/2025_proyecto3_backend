export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {

  create(data: any): Promise<any>;
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  findByEmail(email: string): Promise<any>;
  findByEmailWithPassword(email: string): Promise<any>;
  updatePassword(userId: string, hashedPassword: string): Promise<any>;
}