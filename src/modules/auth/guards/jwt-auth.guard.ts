import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SecurityCookieService,
  SecurityHeaderService,
  SecurityJwtService,
} from '../../../libs/core/security';
import { AuthPayload } from '../types/auth-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: SecurityJwtService,
    private readonly headerService: SecurityHeaderService,
    private readonly cookieService: SecurityCookieService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token =
      this.headerService.getAuthorization(request) ||
      this.cookieService.getCookie(request, 'access_token');

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT secret is missing');
    }

    try {
      const payload = await this.jwtService.verify<AuthPayload>(token, secret);
      request.user = payload;
      return true;
    } catch (error: any) {
      const errorType = this.jwtService.findError(error.message);
      throw new UnauthorizedException(`Invalid access token: ${errorType}`);
    }
  }
}