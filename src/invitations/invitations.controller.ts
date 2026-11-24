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
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/decorators/roles.decorator';
import { user_role } from '@prisma/client';
import { Public } from '../authentication/decorators/public.decorator';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(user_role.Admin_L1, user_role.Super_Admin)
  async createInvitation(
    @Body() dto: CreateInvitationDto,
    @Request() req: any,
  ) {
    return this.invitationsService.createInvitation(dto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(user_role.Admin_L1, user_role.Super_Admin)
  async listInvitations() {
    return this.invitationsService.listInvitations();
  }

  @Get('validate/:token')
  @Public()
  async validateInvitation(@Param('token') token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Post('accept')
  @Public()
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.acceptInvitation(dto);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(user_role.Admin_L1, user_role.Super_Admin)
  async resendInvitation(@Param('id') id: string, @Request() req: any) {
    return this.invitationsService.resendInvitation(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(user_role.Admin_L1, user_role.Super_Admin)
  async revokeInvitation(@Param('id') id: string, @Request() req: any) {
    return this.invitationsService.revokeInvitation(id, req.user.id);
  }
}
