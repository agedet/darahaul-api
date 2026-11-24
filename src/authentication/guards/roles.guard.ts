import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const userRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!userRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // If user is already set by JwtAuthGuard, use it
    if (request.user) {
      const user = request.user;

      if (!user.role) {
        throw new ForbiddenException('User not authenticated');
      }

      if (userRoles.includes(user.role)) {
        return true;
      }

      throw new ForbiddenException('You do not have permission');
    }

    // Fallback: decode token if user is not set (for backwards compatibility)
    // Supports both Bearer header and the `accessToken` HttpOnly cookie.
    let token: string | undefined;

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookieHeader: string | undefined = request.headers.cookie;
      const cookieMatch = cookieHeader
        ?.split(';')
        .map((c: string) => c.trim())
        .find((c: string) => c.startsWith('accessToken='));
      if (cookieMatch) {
        token = decodeURIComponent(cookieMatch.slice('accessToken='.length));
      }
    }

    this.logger.debug(`Auth token present: ${!!token}`);

    if (token) {

      try {
        const decoded = jwt.verify(
          token,
          this.configService.get<string>('JWT_SECRET') as string,
        ) as any;

        if (decoded.user) {
          request.user = {
            id: decoded.user.id,
            email: decoded.user.email,
            role: decoded.user.role,
            firstName: decoded.user.firstName,
            lastName: decoded.user.lastName,
          };
        } else if (decoded.id || decoded.sub) {
          // Handle case where token payload is directly the user object
          request.user = {
            id: decoded.id || decoded.sub,
            email: decoded.email || '',
            role: decoded.role || '',
            firstName: decoded.firstName || decoded.first_name || '',
            lastName: decoded.lastName || decoded.last_name || '',
          };
        } else {
          request.user = decoded;
        }

        this.logger.debug(`Set request.user: ${JSON.stringify(request.user)}`);
      } catch (error) {
        this.logger.error(`Token verification failed: ${error.message}`);
        request.user = null;
      }
    } else {
      this.logger.warn('No authorization header found');
      request.user = null;
    }

    const user = request.user;

    if (!user || !user.role) {
      this.logger.error(
        `User authentication failed. User: ${JSON.stringify(user)}`,
      );
      throw new ForbiddenException('User not authenticated');
    }

    if (userRoles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException('You do not have permission');
  }
}