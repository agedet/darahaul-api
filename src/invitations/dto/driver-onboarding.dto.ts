import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class DriverOnboardingDto {
  @IsOptional()
  @IsString()
  license_number?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergency_phone?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date_of_birth?: Date;

  @IsOptional()
  @IsString()
  emergency_contact_name?: string;
}
