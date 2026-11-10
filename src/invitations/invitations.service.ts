import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { user_role, invitation_status } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

const INVITATION_EXPIRY_DAYS = 7;
const ALLOWED_INVITER_ROLES: user_role[] = [
  user_role.ADMIN_L1,
  user_role.SUPER_ADMIN,
];
const INVITABLE_ROLES: user_role[] = [
  user_role.ADMIN_L2,
  user_role.DRIVER,
  user_role.MECHANIC,
];

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async createInvitation(
    dto: CreateInvitationDto,
    invitedById: string,
  ): Promise<any> {
    // Verify inviter exists and has permission
    const inviter = await this.prisma.users.findUnique({
      where: { id: invitedById },
      include: { user_profile: true },
    });

    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    const inviterRole = inviter.role as user_role;
    if (!ALLOWED_INVITER_ROLES.includes(inviterRole)) {
      throw new BadRequestException(
        'Only ADMIN_L1 or SUPER_ADMIN can send invitations',
      );
    }

    // Validate role is invitable
    if (!INVITABLE_ROLES.includes(dto.role)) {
      throw new BadRequestException(
        `Cannot invite user with role ${dto.role}. Allowed roles: ${INVITABLE_ROLES.join(', ')}`,
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.users.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.invitation.findUnique({
      where: { email: dto.email },
    });

    if (
      existingInvitation &&
      existingInvitation.status === invitation_status.PENDING &&
      existingInvitation.expires_at > new Date()
    ) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
        role: dto.role,
        phone_number: dto.phone_number,
        token: randomUUID(),
        expires_at: expiresAt,
        invited_by: invitedById,
        status: invitation_status.PENDING,
      },
      include: {
        inviter: true,
      },
    });

    // Send invitation email
    try {
      await this.mailService.sendInvitationEmail(dto.email, {
        firstName: dto.first_name,
        lastName: dto.last_name,
        email: dto.email,
        otp: invitation.token,
        inviterName: inviter.user_profile?.fullName || 'Admin',
        role: dto.role,
        expiryMinutes: INVITATION_EXPIRY_DAYS * 24 * 60,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${dto.email}: ${error.message}`,
      );
      // Don't fail the invitation creation if email fails
    }

    this.logger.log(
      `Invitation created for ${dto.email} with role ${dto.role} by ${invitedById}`,
    );

    return {
      id: invitation.id,
      email: invitation.email,
      first_name: invitation.first_name,
      last_name: invitation.last_name,
      role: invitation.role,
      status: invitation.status,
      expires_at: invitation.expires_at,
      created_at: invitation.createdAt,
    };
  }

  async listInvitations(): Promise<any[]> {
    const invitations = await this.prisma.invitation.findMany({
      include: {
        inviter: {
          include: { user_profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      first_name: inv.first_name,
      last_name: inv.last_name,
      role: inv.role,
      phone_number: inv.phone_number,
      status: inv.status,
      expires_at: inv.expires_at,
      invited_by: inv.invited_by,
      inviter_name: inv.inviter?.user_profile?.fullName || 'Unknown',
      created_at: inv.createdAt,
      accepted_at: inv.accepted_at,
    }));
  }

  async getInvitationByToken(token: string): Promise<any> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { inviter: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.status !== invitation_status.PENDING) {
      throw new BadRequestException(
        `Invitation has already been ${invitation.status.toLowerCase()}`,
      );
    }

    if (invitation.expires_at < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: invitation_status.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    return {
      email: invitation.email,
      first_name: invitation.first_name,
      last_name: invitation.last_name,
      role: invitation.role,
      phone_number: invitation.phone_number,
      expires_at: invitation.expires_at,
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto): Promise<any> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.status !== invitation_status.PENDING) {
      throw new BadRequestException(
        `Invitation has already been ${invitation.status.toLowerCase()}`,
      );
    }

    if (invitation.expires_at < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: invitation_status.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user already exists
    const existingUser = await this.prisma.users.findFirst({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const userId = randomUUID();

    const result = await this.prisma.$transaction(async (tx) => {
      // Create auth user
      const newUser = await tx.users.create({
        data: {
          id: userId,
          encrypted_password: hashedPassword,
          instance_id: '00000000-0000-0000-0000-000000000000',
          role: invitation.role,
          email: invitation.email,
          phone: invitation.phone_number,
          is_anonymous: false,
          email_confirmed_at: new Date(),
        },
      });

      // Create user profile
      await tx.user_profiles.create({
        data: {
          id: newUser.id,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          phone_number: invitation.phone_number,
          email: invitation.email,
          password: hashedPassword,
          isActive: true,
          email_confirmed_at: new Date(),
          last_sign_in_at: new Date(),
        },
      });

      // Create role-specific profile
      if (invitation.role === user_role.DRIVER && dto.driver_onboarding) {
        await tx.driver.create({
          data: {
            userId: newUser.id,
            licenseNumber: dto.driver_onboarding.license_number,
            address: dto.driver_onboarding.address,
            emergencyPhone: dto.driver_onboarding.emergency_phone,
            dateOfBirth: dto.driver_onboarding.date_of_birth,
            emergencyContactName: dto.driver_onboarding.emergency_contact_name,
          },
        });
      } else if (
        invitation.role === user_role.MECHANIC &&
        dto.mechanic_onboarding
      ) {
        await tx.mechanic.create({
          data: {
            userId: newUser.id,
            specialty: dto.mechanic_onboarding.specialty,
            certifications: dto.mechanic_onboarding.certifications,
            yearsOfExperience: dto.mechanic_onboarding.years_of_experience,
            hourlyRate: dto.mechanic_onboarding.hourly_rate,
          },
        });
      }

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: invitation_status.ACCEPTED,
          accepted_at: new Date(),
        },
      });

      return await tx.users.findUnique({
        where: { id: newUser.id },
        include: {
          user_profile: true,
        },
      });
    });

    this.logger.log(
      `Invitation accepted for ${invitation.email} with role ${invitation.role}`,
    );

    if (!result) {
      throw new BadRequestException('Failed to create user');
    }

    return {
      message: 'Invitation accepted successfully',
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
    };
  }

  async revokeInvitation(id: string, userId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== invitation_status.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    // Verify user has permission
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    const allowedRoles: user_role[] = [user_role.ADMIN_L1, user_role.SUPER_ADMIN];
    if (!user || !allowedRoles.includes(user.role as user_role)) {
      throw new BadRequestException('Insufficient permissions');
    }

    await this.prisma.invitation.update({
      where: { id },
      data: { status: invitation_status.REVOKED },
    });

    this.logger.log(`Invitation ${id} revoked by ${userId}`);
  }
}
