import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MechanicOnboardingDto {
  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  certifications?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  years_of_experience?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hourly_rate?: number;
}
