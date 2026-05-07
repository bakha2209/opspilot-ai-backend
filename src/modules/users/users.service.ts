import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { SecurityBcryptJsService } from '../../libs/core/security';
import { UserEntity } from '../../libs/database/entity';
import { UserRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';


@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly bcryptService: SecurityBcryptJsService,
  ) {}

  async createCompanyUser(currentUser: AuthPayload, dto: CreateCompanyUserDto) {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    if (
      dto.role === UserRole.SUPER_ADMIN ||
      dto.role === UserRole.COMPANY_ADMIN
    ) {
      throw new ForbiddenException(
        'Cannot create this role from company user API',
      );
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.bcryptService.hashPassword(dto.password);

    const user = await this.userRepository.createAndSaveItem({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: dto.role,
      companyId: currentUser.companyId,
    } as Partial<UserEntity>);

    return apiSuccess(
      'Company user created successfully',
      this.sanitizeUser(user),
    );
  }

  async findCompanyUsers(currentUser: AuthPayload) {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    const users = await this.userRepository.findByCompanyId(
      currentUser.companyId,
    );

    return apiSuccess(
      'Company users retrieved successfully',
      users.map((user) => this.sanitizeUser(user)),
    );
  }

  async updateCompanyUserRole(
    currentUser: AuthPayload,
    userId: string,
    dto: UpdateUserRoleDto,
  ) {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    if (
      dto.role === UserRole.SUPER_ADMIN ||
      dto.role === UserRole.COMPANY_ADMIN
    ) {
      throw new ForbiddenException(
        'Cannot assign this role from company user API',
      );
    }

    const user = await this.userRepository.findByIdAndCompanyId(
      userId,
      currentUser.companyId,
    );

    if (!user) {
      throw new NotFoundException('User not found in your company');
    }

    user.role = dto.role;

    const saved = await this.userRepository.saveItem(user);

    return apiSuccess(
      'User role updated successfully',
      this.sanitizeUser(saved),
    );
  }

  async removeCompanyUser(currentUser: AuthPayload, userId: string) {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    if (currentUser.sub === userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.userRepository.findByIdAndCompanyId(
      userId,
      currentUser.companyId,
    );

    if (!user) {
      throw new NotFoundException('User not found in your company');
    }

    await this.userRepository.softDeleteItem(user);

    return apiSuccess('Company user deleted successfully', { id: userId });
  }

  private sanitizeUser(user: UserEntity) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
