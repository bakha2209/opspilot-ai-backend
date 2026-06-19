import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiInternalGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const apiKey = request.headers['x-ai-internal-key'];

    const expected = this.configService.get<string>('AI_INTERNAL_API_KEY');

    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException('Invalid AI internal key');
    }

    return true;
  }
}
