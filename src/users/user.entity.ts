import { Role } from 'src/common/enums/roles.enums';

export class User {

  public readonly id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
  subAreaId?: number;         
  public readonly fechaRegistro?: Date;         
  public readonly deletedAt?: Date;

}