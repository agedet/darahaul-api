import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/decorators/roles.decorator';
import { user_role } from '@prisma/client';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(user_role.Admin_L1, user_role.Super_Admin)
  async listUsers(@Request() req: AuthenticatedRequest) {
    const users = await this.usersService.fetchUsers();
    // Admin_L1 only sees team roles: Admin_L2, Mechanic, Driver.
    if (req.user.role === 'Admin_L1') {
      const visible = ['ADMIN_L2', 'MECHANIC', 'DRIVER'];
      return users.filter((u) =>
        visible.includes((u.role || '').toString().toUpperCase()),
      );
    }
    return users;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(user_role.Admin_L1, user_role.Super_Admin)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateUser(id, dto, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(user_role.Admin_L1, user_role.Super_Admin)
  async deleteUser(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usersService.softDeleteUser(id, req.user.id, req.user.role);
  }
}
