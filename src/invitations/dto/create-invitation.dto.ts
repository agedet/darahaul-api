import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { user_role } from '@prisma/client';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  first_name: string;

  @IsString()
  @MinLength(1)
  last_name: string;

  @IsEnum(user_role)
  role: user_role;

  @IsOptional()
  @IsString()
  phone_number?: string;
}
