import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  iat?: number;
  exp?: number;
}
