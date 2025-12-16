import { Role } from 'src/common/enums/roles.enums';

export class User {

  public readonly _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
  public readonly createdAt?: Date;
  public readonly deletedAt?: Date;

}