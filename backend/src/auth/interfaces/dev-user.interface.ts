import { Role } from '../enums/role.enum';

export interface DevUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
}
