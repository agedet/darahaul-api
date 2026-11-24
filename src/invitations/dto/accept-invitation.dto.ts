import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DriverOnboardingDto } from './driver-onboarding.dto';
import { MechanicOnboardingDto } from './mechanic-onboarding.dto';

export class AcceptInvitationDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DriverOnboardingDto)
  driver_onboarding?: DriverOnboardingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MechanicOnboardingDto)
  mechanic_onboarding?: MechanicOnboardingDto;
}
