import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { randomUUID } from 'crypto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingEmail = await this.prisma.users.findFirst({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    if (createUserDto.phone_number) {
      const existingPhone = await this.prisma.users.findFirst({
        where: {
          phone: createUserDto.phone_number,
        },
      });

      if (existingPhone) {
        throw new Error('User with this phone number already exists');
      }
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const userId = randomUUID();

      // First, create the user
      const newUser = await tx.users.create({
        data: {
          id: userId,
          encrypted_password: createUserDto.password,
          instance_id: '00000000-0000-0000-0000-000000000000',
          role: createUserDto.role,
          email: createUserDto.email,
          phone: createUserDto.phone_number,
          is_anonymous: false,
        },
      });

      // Then, create the user profile with the user's id
      await tx.user_profiles.create({
        data: {
          id: newUser.id,
          first_name: createUserDto.first_name,
          last_name: createUserDto.last_name,
          phone_number: createUserDto.phone_number,
          email: createUserDto.email,
          password: createUserDto.password,
          country: createUserDto.country,
          state: createUserDto.state,
          date_of_birth: new Date(createUserDto.date_of_birth),
          terms_accepted: createUserDto.terms_accepted,
        },
      });

      // Return the user with profile
      return await tx.users.findUnique({
        where: { id: newUser.id },
        include: {
          user_profile: true,
        },
      });
    });

    return this.formatUser(user);
  }

  async fetchUsers(): Promise<UserEntity[]> {
    const users = await this.prisma.users.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        user_profile: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const userList = users.map((user) => this.formatUser(user));

    return userList;
  }

  async findUserById(id: string): Promise<UserEntity> {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: {
        user_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return this.formatUser(user);
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.users.findFirst({
      where: { email },
      include: {
        user_profile: true,
      },
    });

    if (!user) {
      return null;
    }

    return this.formatUser(user);
  }

  async finduserByPhone(phone_number: string): Promise<UserEntity | null> {
    const user = await this.prisma.users.findFirst({
      where: { phone: phone_number },
      include: {
        user_profile: true,
      },
    });

    if (!user) {
      return null;
    }

    return this.formatUser(user);
  }

  async updateUserPassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<UserEntity> {
    const existingUser = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User not found`);
    }

    const user = await this.prisma.$transaction(async (tx) => {
      return await tx.users.update({
        where: { id },
        data: {
          encrypted_password: updatePasswordDto.newPassword,
        },
        include: {
          user_profile: true,
        },
      });
    });

    return this.formatUser(user);
  }

  async updateUserInfo(
    id: string,
    updateData: Partial<CreateUserDto>,
  ): Promise<UserEntity> {
    const existingUser = await this.prisma.users.findUnique({
      where: { id, deleted_at: null },
    });

    if (!existingUser) {
      throw new NotFoundException(`User not found`);
    }

    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.prisma.users.findFirst({
        where: { email: updateData.email, id: { not: id }, deleted_at: null },
      });

      if (emailExists) {
        throw new ConflictException('Email already taken by another user.');
      }
    }

    const {
      email,
      last_sign_in_at,
      email_confirmed_at,
      otp_count,
      otp_generated_at,
      ...profileData
    } = updateData;

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Update users table
      const user = await tx.users.update({
        where: { id },
        data: {
          email: email ?? existingUser.email,
          last_sign_in_at: last_sign_in_at ?? undefined,
          email_confirmed_at: email_confirmed_at ?? undefined,
        },
      });

      // Update users_profiles table (includes otp_count and otp_generated_at)
      await tx.user_profiles.update({
        where: { id },
        data: {
          ...(otp_count !== undefined && { otp_count }),
          ...(otp_generated_at !== undefined && { otp_generated_at }),
          ...profileData,
        },
      });

      // Return user with updated profile
      return await tx.users.findUnique({
        where: { id },
        include: {
          user_profile: true,
        },
      });
    });

    return this.formatUser(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.users.delete({
      where: { id },
    });
  }

  formatUser(user: any): UserEntity {
    const isActive = user.email_confirmed_at !== null;
    const status = isActive ? 'active' : 'invited';

    const profile = user.user_profile;

    return {
      id: user.id,
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      country: profile?.country || '',
      state: profile?.state || '',
      date_of_birth: profile?.date_of_birth
        ? new Date(profile.date_of_birth).toISOString()
        : '',
      terms_accepted: profile?.terms_accepted || false,
      email: user.email,
      phone_number: profile?.phone_number || '',
      role: user.role,
      status: status,
      created_at: user.created_at ? new Date(user.created_at) : new Date(),
      updated_at: user.updated_at ? new Date(user.updated_at) : new Date(),
      deleted_at: user.deleted_at ? new Date(user.deleted_at) : undefined,
      is_anonymous: user.is_anonymous || false,
      instance_id: user.instance_id || '00000000-0000-0000-0000-000000000000',
      email_confirmed_at: user.email_confirmed_at
        ? new Date(user.email_confirmed_at)
        : new Date(),
      otp_count: profile?.otp_count || 0,
      otp_generated_at: profile?.otp_generated_at
        ? new Date(profile.otp_generated_at)
        : undefined,
      password: user.encrypted_password || '',
      last_sign_in_at: user.last_sign_in_at
        ? new Date(user.last_sign_in_at)
        : undefined,
    };
  }
}