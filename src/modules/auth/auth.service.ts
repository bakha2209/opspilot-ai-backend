import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SecurityBcryptJsService,
  SecurityJwtService,
} from '../../libs/core/security';
import {
  CompanyRepository,
  UserRepository,
} from '../../libs/database/repository';
import { UserRole } from '../../common/enums/user-role.enum';
import { CompanyEntity, UserEntity } from '../../libs/database/entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthPayload } from './types/auth-payload.type';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly bcryptService: SecurityBcryptJsService,
    private readonly jwtService: SecurityJwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const company = await this.companyRepository.createAndSaveItem({
      name: dto.companyName,
      businessNumber: dto.businessNumber,
      email: dto.email,
    } as Partial<CompanyEntity>);

    const hashedPassword = await this.bcryptService.hashPassword(dto.password);

    const user = await this.userRepository.createAndSaveItem({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: UserRole.COMPANY_ADMIN,
      companyId: company.id,
    } as Partial<UserEntity>);

    const token = await this.createAccessToken(user);

    return apiSuccess('Signup completed successfully', {
      accessToken: token,
      user: this.sanitizeUser(user),
      company,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const compareResult = await this.bcryptService.compare(
      dto.password,
      user.password,
    );

    if (compareResult !== 1) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.createAccessToken(user);

    return apiSuccess('Login completed successfully', {
      accessToken: token,
      user: this.sanitizeUser(user),
    });
  }

  private async createAccessToken(user: UserEntity): Promise<string> {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is missing');
    }

    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return this.jwtService.sign(payload, secret, {
      expiresIn: '1d',
    });
  }

  private sanitizeUser(user: UserEntity) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}