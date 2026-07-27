import { Body, Controller, ForbiddenException, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthPayload } from './types/auth-payload.type';
import { Auth } from './decorators/auth.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Create company and company admin account' })
  signup(@Body() dto: SignupDto) {
    const configured = this.configService.get<string>('SIGNUP_ENABLED');
    const enabled =
      configured === 'true' ||
      (configured === undefined &&
        this.configService.get<string>('NODE_ENV') !== 'production');

    if (!enabled) {
      throw new ForbiddenException('Public signup is disabled');
    }

    return this.authService.signup(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  profile(@CurrentUser() user: AuthPayload) {
    return this.authService.profile(user.sub);
  }
}
