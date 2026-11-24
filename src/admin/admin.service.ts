import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { InvitationsService } from '../invitations/invitations.service';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { user_role, invitation_status } from '@prisma/client';
import { randomUUID } from 'crypto';

const INVITATION_EXPIRY_DAYS = 7;
const ADMIN_ROLES: user_role[] = [
  user_role.Super_Admin,
  user_role.Admin_L1,
  user_role.Admin_L2,
];

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly invitationsService: InvitationsService,
  ) {}

  async inviteAdmin(
    dto: InviteAdminDto,
    invitedById: string,
  ): Promise<Record<string, unknown>> {
    const inviter = await this.prisma.users.findUnique({
      where: { id: invitedById },
      include: { user_profile: true },
    });

    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    if (inviter.role !== user_role.Super_Admin) {
      throw new BadRequestException('Only SUPER_ADMIN can invite admins');
    }

    if (!ADMIN_ROLES.includes(dto.role)) {
      throw new BadRequestException(
        `Cannot invite role ${dto.role}. Allowed roles: ${ADMIN_ROLES.join(', ')}`,
      );
    }

    const existingUser = await this.prisma.users.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

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
        inviter: { include: { user_profile: true } },
      },
    });

    try {
      await this.mailService.sendSuperAdminInvitationEmail(dto.email, {
        firstName: dto.first_name,
        lastName: dto.last_name,
        email: dto.email,
        otp: invitation.token,
        inviterRole: user_role.Super_Admin,
        role: dto.role,
        expiryMinutes: INVITATION_EXPIRY_DAYS * 24 * 60,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send admin invitation email to ${dto.email}: ${(error as Error).message}`,
      );
    }

    this.logger.log(
      `Admin invitation created for ${dto.email} with role ${dto.role} by ${invitedById}`,
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

  async listAdminInvitations(): Promise<Record<string, unknown>[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: { role: { in: ADMIN_ROLES } },
      include: {
        inviter: { include: { user_profile: true } },
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
      inviter_name: inv.inviter?.user_profile?.fullName || 'Super Admin',
      created_at: inv.createdAt,
      accepted_at: inv.accepted_at,
    }));
  }

  async listAdminUsers(): Promise<Record<string, unknown>[]> {
    const users = await this.prisma.users.findMany({
      where: {
        role: { in: ADMIN_ROLES },
        deleted_at: null,
      },
      include: { user_profile: true },
      orderBy: { created_at: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.user_profile?.first_name || '',
      last_name: user.user_profile?.last_name || '',
      phone_number: user.user_profile?.phone_number || user.phone || '',
      role: user.role,
      status: user.email_confirmed_at ? 'active' : 'invited',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    }));
  }

  async revokeInvitation(id: string, userId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (!ADMIN_ROLES.includes(invitation.role)) {
      throw new BadRequestException(
        'This endpoint can only revoke admin invitations',
      );
    }

    return this.invitationsService.revokeInvitation(id, userId);
  }
}
