import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

export class AuthUserDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User email address' })
  email!: string;

  @ApiProperty({ description: 'User display name' })
  name!: string;

  @ApiProperty({ description: 'User role', enum: Role })
  role!: Role;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ description: 'Token expiry in seconds', example: 604800 })
  expiresIn!: number;

  @ApiProperty({ description: 'Authenticated user details', type: AuthUserDto })
  user!: AuthUserDto;
}
