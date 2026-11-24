import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UpdatePersonalProfileDto } from './dto/personal-profile.dto';
import { CompleteOnboardingDto } from './dto/onboarding.dto';
import { user_role } from '@prisma/client';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPersonalProfile(user: any) {
    try {
      // validate user ID format
      if (!user || !user.id) {
        throw new BadRequestException(
          'Invalid user ID format: user or user.id is missing',
        );
      }

      if (typeof user.id !== 'string') {
        throw new BadRequestException(
          `Invalid user ID format: expected string, got ${typeof user.id}`,
        );
      }

      const userProfile = await this.prisma.users.findUnique({
        where: { id: user.id },
        include: {
          user_profile: true,
        },
      });

      if (!userProfile) {
        throw new NotFoundException('User profile not found');
      }

      // If user exist but doesn't have a profile, create a new one
      if (!userProfile.user_profile) {
        try {
          const userWithProfile = await this.prisma.users.update({
            where: { id: user.id },
            data: {
              user_profile: {
                create: {
                  email: user.email || userProfile.email || '',
                  password: user.password || '',
                  first_name: user.firstName || user.first_name || '',
                  last_name: user.lastName || user.last_name || '',
                  phone_number: user.phone_number || '',
                  country: user.country || '',
                  state: user.state || '',
                  date_of_birth: user.date_of_birth || new Date(),
                  terms_accepted: user.terms_accepted || false,
                  otp_count: user.otp_count || 0,
                  otp_generated_at: user.otp_generated_at || null,
                },
              },
            },
            include: {
              user_profile: true,
            },
          });

          return this.formatPersonalProfile(userWithProfile);
        } catch (createError) {
          this.logger.error(
            `Failed to create profile: ${createError.message}`,
            createError.stack,
          );
          return this.formatPersonalProfile(userProfile);
        }
      }

      // User has a profile, return it
      return this.formatPersonalProfile(userProfile);
    } catch (error) {
      this.logger.error(
        `Failed to get personal profile: ${error.message}`,
        error.stack,
      );
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get personal profile: ${error.message}`,
      );
    }
  }

  async updatePersonalProfile(
    user: any,
    updateDto: UpdatePersonalProfileDto,
  ): Promise<any> {
    try {
      // validate user ID format
      if (!user.id || typeof user.id !== 'string') {
        throw new BadRequestException('Invalid user ID format');
      }

      const existingUser = await this.prisma.users.findUnique({
        where: { id: user.id },
        include: {
          user_profile: true,
        },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      if (!existingUser.user_profile) {
        throw new NotFoundException('User profile not found');
      }
    } catch (findError) {
      throw new BadRequestException('Failed to find user profile');
    }

    try {
      const { role, ...profileData } = updateDto;
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        return await tx.users.update({
          where: { id: user.id },
          data: {
            user_profile: {
              update: {
                ...profileData,
              },
            },
          },
          include: {
            user_profile: true,
          },
        });
      });
      return this.formatPersonalProfile(updatedUser);
    } catch (updateError) {
      throw new BadRequestException('Failed to update personal profile');
    }
  }

  /**
   * Create or update the role-specific profile for drivers and mechanics.
   * Safe to call multiple times (upsert) so it can also be used for edits.
   */
  async completeOnboarding(
    user: any,
    dto: CompleteOnboardingDto,
  ): Promise<any> {
    if (!user?.id || typeof user.id !== 'string') {
      throw new BadRequestException('Invalid user ID format');
    }

    const role = (user.role || '').toString().toUpperCase();

    if (role === user_role.Driver && dto.driver_onboarding) {
      const data = dto.driver_onboarding;
      const profile = await this.prisma.driver.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          licenseNumber: data.license_number,
          address: data.address,
          emergencyPhone: data.emergency_phone,
          dateOfBirth: data.date_of_birth,
          emergencyContactName: data.emergency_contact_name,
        },
        update: {
          licenseNumber: data.license_number,
          address: data.address,
          emergencyPhone: data.emergency_phone,
          dateOfBirth: data.date_of_birth,
          emergencyContactName: data.emergency_contact_name,
        },
      });

      return {
        message: 'Driver profile saved successfully',
        onboardingCompleted: true,
        driver: profile,
      };
    }

    if (role === user_role.Mechanic && dto.mechanic_onboarding) {
      const data = dto.mechanic_onboarding;
      const profile = await this.prisma.mechanic.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          specialty: data.specialty,
          certifications: data.certifications,
          yearsOfExperience: data.years_of_experience,
          hourlyRate: data.hourly_rate,
        },
        update: {
          specialty: data.specialty,
          certifications: data.certifications,
          yearsOfExperience: data.years_of_experience,
          hourlyRate: data.hourly_rate,
        },
      });

      return {
        message: 'Mechanic profile saved successfully',
        onboardingCompleted: true,
        mechanic: profile,
      };
    }

    throw new BadRequestException(
      'Onboarding data does not match your role or is missing',
    );
  }

  private formatPersonalProfile(user: any) {
    const profile = user.user_profile;
    return {
      id: user.id,
      email: profile?.email || user.email || '',
      password: profile?.password || '',
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone_number: profile?.phone_number || '',
      country: profile?.country || '',
      state: profile?.state || '',
      date_of_birth: profile?.date_of_birth || null,
      terms_accepted: profile?.terms_accepted || false,
      role: profile?.role || user.role || '',
      otp_count: profile?.otp_count || 0,
      otp_generated_at: profile?.otp_generated_at || null,
    };
  }
}
