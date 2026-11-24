import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
// import {
//   ApiBearerAuth,
//   ApiOperation,
//   ApiResponse,
//   ApiTags,
// } from '@nestjs/swagger';
import { RolesGuard } from 'src/authentication/guards/roles.guard';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { user_role } from '@prisma/client';
import { Roles } from '../authentication/decorators/roles.decorator';
import { UpdatePersonalProfileDto } from './dto/personal-profile.dto';
import { CompleteOnboardingDto } from './dto/onboarding.dto';

// @ApiTags('Profile')
@Controller('profile')
// @ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('personal')
  @Roles(
    user_role.Driver,
    user_role.Mechanic,
    user_role.Admin_L1,
    user_role.Admin_L2,
    user_role.Super_Admin,
  )
//   @ApiOperation({ summary: 'Get personal profile' })
//   @ApiResponse({
//     status: 200,
//     description: 'Personal profile retrieved successfully',
//   })
//   @ApiResponse({ status: 400, description: 'Invalid user ID format' })
//   @ApiResponse({ status: 404, description: 'User profile not found' })
  async getPersonalProfile(@Request() req: any) {
    return this.profileService.getPersonalProfile(req.user);
  }

  @Patch('personal')
  @Roles(
    user_role.Driver,
    user_role.Mechanic,
    user_role.Admin_L1,
    user_role.Admin_L2,
    user_role.Super_Admin,
  )
//   @ApiOperation({ summary: 'Update personal profile' })
//   @ApiResponse({
//     status: 200,
//     description: 'Personal profile updated successfully',
//   })
//   @ApiResponse({ status: 400, description: 'Invalid user ID format' })
//   @ApiResponse({ status: 404, description: 'User profile not found' })
  async updatePersonalProfile(
    @Request() req: any,
    @Body() updateDto: UpdatePersonalProfileDto,
  ) {
    return this.profileService.updatePersonalProfile(req.user, updateDto);
  }

  @Post('onboarding')
  @Roles(user_role.Driver, user_role.Mechanic)
  async completeOnboarding(
    @Request() req: any,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.profileService.completeOnboarding(req.user, dto);
  }
}