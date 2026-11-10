import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  Req,
  Param,
} from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBearerAuth,
//   ApiBody,
//   ApiParam,
// } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, VerifyOtpDto } from './dto';

// @ApiBearerAuth('JWT')
// @ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
//   @ApiOperation({ summary: 'Register a new user' })
//   @ApiResponse({ status: 201, description: 'User registered successfully' })
//   @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Login and send OTP' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Verify OTP and get access/refresh tokens' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('resend-otp/:email')
  @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Resend OTP to the user' })
  async resendOtp(@Param('email') email: string) {
    return this.authService.resendOtp(email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Request a password reset email' })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: { email: { type: 'string', format: 'email' } },
//     },
//   })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Reset user password (requires authentication)' })
  async resetPassword(@Req() req, @Body() resetPasswordDto: ResetPasswordDto) {
    //check if user is logged in
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not found');
    }
    return this.authService.resetPassword(req.user.id, resetPasswordDto);
  }
}