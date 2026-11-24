import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DriverOnboardingDto } from '../../invitations/dto/driver-onboarding.dto';
import { MechanicOnboardingDto } from '../../invitations/dto/mechanic-onboarding.dto';

/**
 * Payload for post-login onboarding/profile completion.
 * The authenticated user's role determines which nested object is used:
 * - DRIVER  -> driver_onboarding
 * - MECHANIC -> mechanic_onboarding
 */
export class CompleteOnboardingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverOnboardingDto)
  driver_onboarding?: DriverOnboardingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MechanicOnboardingDto)
  mechanic_onboarding?: MechanicOnboardingDto;
}
