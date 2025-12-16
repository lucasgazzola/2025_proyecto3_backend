import { JwtPayload } from 'jsonwebtoken';
import { Role } from '../enums/roles.enums';

export interface Payload extends JwtPayload {
  id: string;
  role: Role | keyof typeof Role | string;
  email: string;
  firstName?: string;
  lastName?: string;
  exp: number;
}