import { Module, Provider } from '@nestjs/common';
import { SecurityAESIVService } from './security-aes-iv.service';
import { SecurityBase64Service } from './security-base64.service';
import { SecurityBcryptJsService } from './security-bcrypt-js.service';
import { SecurityCookieService } from './security-cookie.service';
import { SecurityHeaderService } from './security-header.service';
import { SecurityJwtService } from './security-jwt.service';

const providers: Provider[] = [
  SecurityAESIVService,
  SecurityBase64Service,
  SecurityBcryptJsService,
  SecurityCookieService,
  SecurityHeaderService,
  SecurityJwtService,
];

@Module({
  providers,
  exports: providers,
})
export class SecurityModule {}