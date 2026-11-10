import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { AuthResponse } from './interfaces/auth-response.interface';
import { user_role } from '@prisma/client';
import { VerifyOtpDto } from './dto';
import { HOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';

@Injectable()
export class AuthService {
  private readonly secret: string;
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private usersService: UsersService,
  ) {
    this.secret = this.configService.get<string>('HOTP_SECRET') || '';
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse | any> {
    const existingUser = await this.usersService.findUserByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingPhoneUser = await this.usersService.finduserByPhone(
      registerDto.phone_number,
    );

    if (existingPhoneUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const user = await this.usersService.createUser({
      email: registerDto.email,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      phone_number: registerDto.phone_number,
      country: registerDto.country,
      state: registerDto.state,
      date_of_birth: registerDto.date_of_birth,
      terms_accepted: registerDto.terms_accepted,
      password: hashedPassword,
      role: user_role.DRIVER,
    });

    //generate otp
    const token = await this.generateOTP({
      id: user.id,
      otp_count: user.otp_count ?? 0,
    });

    //email user with professional template
    try {
      await this.mailService.sendWelcomeEmail(user.email, {
        firstName: user.first_name || 'User',
        lastName: user.last_name || '',
        email: user.email,
        otp: token,
        role: user.role || 'user',
        expiryMinutes: 10,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${user.email}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to send welcome email.');
    }

    return {
      message: `If this email exists in our system, an OTP has been sent.`,
      user: {
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse | any> {
    const { email, password } = loginDto;
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const validPassword = await this.comparePassword(password, user.password);

    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }
    //generate otp
    const token = await this.generateOTP({
      id: user.id,
      otp_count: user.otp_count ?? 0,
    });

    //email user with professional login template
    await this.mailService.sendLoginOTPEmail(user.email, {
      firstName: user?.first_name || 'User',
      lastName: user?.last_name || '',
      email: user.email,
      otp: token,
      expiryMinutes: 10,
    });

    this.logger.log(`Login OTP email sent to ${user.email}`);

    return {
      message: `If this email exists in our system, an OTP has been sent.`,
      user: {
        email: user.email,
      },
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse | any> {
    const { email, otp } = dto;

    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException('Invalid user');
    }

    const otpGeneratedAt = user.otp_generated_at;
    if (!otpGeneratedAt) {
      throw new UnauthorizedException('OTP not generated, request a new one');
    }

    const OTP_EXPIRY_MINUTES = 10;
    const expirationTime = new Date(
      otpGeneratedAt.getTime() + OTP_EXPIRY_MINUTES * 60000,
    );

    if (new Date() > expirationTime) {
      throw new UnauthorizedException('OTP expired, request a new one');
    }

    const currentCounter =
      user.otp_count || Math.floor(Math.random() * 1000000);

    const hotpInstance = new HOTP({
      secret: this.secret,
      digits: 6,
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });

    const verifyResult = await hotpInstance.verify({
      token: otp,
      counter: currentCounter,
    });
    const isValid = verifyResult.valid;

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // OTP is valid, proceed with user activation and token generation
    await this.usersService.updateUserInfo(user.id, {
      otp_count: currentCounter + 1,
      otp_generated_at: new Date(),
      email_confirmed_at: new Date(),
      last_sign_in_at: new Date(),
    });

    // try {
    //   await this.userActivationService.activateInvitedUser(user.id);
    // } catch (error) {
    //   throw new BadRequestException(`Failed to activate user`);
    // }

    const tokens = this.generateTokens(
      {
        email: user.email ?? '',
        id: user.id,
        role: user.role ?? '',
      },
      user.first_name,
      user.last_name,
    );

    this.logger.log(
      `OTP verified successfully - Account activated for ${user.email}`,
    );

    return {
      ...tokens,
      message: 'OTP verified successfully - Account activated',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        role: user.role,
      },
    };
  }

  async resendOtp(email: string): Promise<AuthResponse | any> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    const token = await this.generateOTP({
      id: user.id,
      otp_count: user.otp_count ?? 0,
    });

    await this.mailService.sendResendOTPEmail(user.email, {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      otp: token,
      expiryMinutes: 10,
    });

    this.logger.log(`Resend OTP email sent to ${user.email}`);

    return {
      message: `If this email exists in our system, an OTP has been sent.`,
      user: {
        email: user.email,
      },
    };
  }

  private generateTokens(
    user: { id: string; role: string; email: string },
    firstName: string,
    lastName: string,
  ): { accessToken: string } {
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: firstName,
        lastName: lastName,
      },
      userId: user.id,
    };

    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`Tokens generated for ${user.email}`);
    return { accessToken };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      // For security reasons, do not reveal if the email exists or not
      return {
        message:
          'If a user with that email exists, a password reset email will be sent.',
      };
    }
    this.logger.log(`Forgot password email sent to ${email}`);

    return await this.resendOtp(email);
  }

  async resetPassword(
    id: string,
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { newPassword } = dto;
    //check if newPassword and confirmNewPassword match
    if (newPassword !== dto.confirmNewPassword) {
      throw new ConflictException('New password and confirmation do not match');
    }

    const user = await this.usersService.findUserById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const hashedPassword = await this.hashPassword(newPassword);

    await this.usersService.updateUserPassword(id, {
      newPassword: hashedPassword,
    });

    this.logger.log(`Password reset successfully for ${user.email}`);

    return { ...user, message: 'Password has been reset successfully.' };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(email);

    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }

    this.logger.log(`Invalid credentials for ${email}`);

    return null;
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async hashPassword(password: string) {
    const result = await bcrypt.hash(password, 12);
    return result;
  }

  async generateOTP(user: { id: string; otp_count: number }): Promise<string> {
    const hotpInstance = new HOTP({
      secret: this.secret,
      digits: 6,
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });

    const baseCounter =
      typeof user.otp_count === 'number' && user.otp_count > 0
        ? user.otp_count
        : Math.floor(Math.random() * 1000000);

    const newCounter = baseCounter + 1;

    const token = await hotpInstance.generate(newCounter);

    await this.usersService.updateUserInfo(user.id, {
      otp_count: newCounter,
      otp_generated_at: new Date(),
    });

    this.logger.log(`OTP generated for ${user.id}`);

    return token;
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      return false;
    }

    const otpGeneratedAt = user.otp_generated_at;
    if (!otpGeneratedAt) {
      return false;
    }

    const OTP_EXPIRY_MINUTES = 10;
    const expirationTime = new Date(
      otpGeneratedAt.getTime() + OTP_EXPIRY_MINUTES * 60000,
    );

    if (new Date() > expirationTime) {
      return false;
    }

    const currentCounter =
      user.otp_count || Math.floor(Math.random() * 1000000);

    const hotpInstance = new HOTP({
      secret: this.secret,
      digits: 6,
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });

    const verifyResult = await hotpInstance.verify({
      token: otp,
      counter: currentCounter,
    });
    const isValid = verifyResult.valid;

    if (isValid) {
      await this.usersService.updateUserInfo(user.id, {
        otp_count: currentCounter + 1,
      });
      this.logger.log(`OTP verified successfully for ${email}`);
    }

    this.logger.log(`OTP verified for ${email}`);

    return isValid;
  }

  async sendOTPEmail(
    email: string,
    subject: string,
    content: string,
  ): Promise<void> {
    try {
      await this.mailService.sendMail(email, subject, content);
    } catch (error) {
      throw new InternalServerErrorException('Failed to send OTP email.');
    }
  }
}