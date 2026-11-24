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
  Res,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, VerifyOtpDto } from './dto';
import { Public } from './decorators/public.decorator';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 30 * ONE_DAY_MS;

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ONE_DAY_MS));
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      cookieOptions(REFRESH_TOKEN_MAX_AGE_MS),
    );
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  private getCookie(req: any, name: string): string | undefined {
    const header: string | undefined = req?.headers?.cookie;
    if (!header) return undefined;
    const match = header
      .split(';')
      .map((c: string) => c.trim())
      .find((c: string) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(verifyOtpDto);

    // Cookie-based auth: tokens are delivered via HttpOnly cookies only.
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    const { accessToken, refreshToken, ...body } = result;
    return body;
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async session(@Req() req: any) {
    return this.authService.getSession(req.user);
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.getCookie(req, REFRESH_TOKEN_COOKIE);
    const { accessToken } = await this.authService.refreshAccessToken(
      refreshToken ?? '',
    );

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ONE_DAY_MS));
    return { message: 'Token refreshed' };
  }

  @Post('resend-otp/:email')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Param('email') email: string) {
    return this.authService.resendOtp(email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Req() req, @Body() resetPasswordDto: ResetPasswordDto) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not found');
    }
    return this.authService.resetPassword(req.user.id, resetPasswordDto);
  }
}
