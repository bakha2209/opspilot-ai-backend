import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../../common/enums/user-role.enum';
import { SecurityBcryptJsService } from '../../core/security';
import { UserEntity } from '../entity';
import { UserRepository } from '../repository';

@Injectable()
export class SuperAdminSeeder {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly bcryptService: SecurityBcryptJsService,
  ) {}

  async seed() {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    const name =
      this.configService.get<string>('SUPER_ADMIN_NAME') || 'Super Admin';

    if (!email || !password) {
      this.logger.warn('Super admin seed skipped: env values are missing');
      return;
    }

    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      this.logger.log('Super admin already exists');
      return;
    }

    const hashedPassword = await this.bcryptService.hashPassword(password);

    await this.userRepository.createAndSaveItem({
      email,
      name,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      companyId: null,
    } as Partial<UserEntity>);

    this.logger.log(`Super admin created: ${email}`);
  }
}