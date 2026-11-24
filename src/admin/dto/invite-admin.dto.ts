import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { user_role } from '@prisma/client';

const ADMIN_ROLES = [
  user_role.Super_Admin,
  user_role.Admin_L1,
  user_role.Admin_L2,
] as const;

export class InviteAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  first_name: string;

  @IsString()
  @MinLength(1)
  last_name: string;

  @IsEnum(user_role, {
    message: `role must be one of: ${ADMIN_ROLES.join(', ')}`,
  })
  role: (typeof ADMIN_ROLES)[number];

  @IsOptional()
  @IsString()
  phone_number?: string;
}
