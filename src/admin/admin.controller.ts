import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/decorators/roles.decorator';
import { user_role } from '@prisma/client';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(user_role.Super_Admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('invitations')
  async inviteAdmin(
    @Body() dto: InviteAdminDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.inviteAdmin(dto, req.user.id);
  }

  @Get('invitations')
  async listAdminInvitations() {
    return this.adminService.listAdminInvitations();
  }

  @Get('users')
  async listAdminUsers() {
    return this.adminService.listAdminUsers();
  }

  @Delete('invitations/:id')
  async revokeInvitation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.revokeInvitation(id, req.user.id);
  }
}
