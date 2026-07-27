import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { apiSuccess } from '../../common/utils/api-response.utils';
import { SecurityBcryptJsService } from '../../libs/core/security';
import { CompanyEntity, UserEntity } from '../../libs/database/entity';
import {
  CompanyRepository,
  UserRepository,
} from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly bcryptService: SecurityBcryptJsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateCompanyDto) {
    const existingUser = await this.userRepository.findByEmail(dto.adminEmail);

    if (existingUser) {
      throw new ConflictException('Administrator email already exists');
    }

    const hashedPassword = await this.bcryptService.hashPassword(
      dto.adminPassword,
    );
    const runner = this.dataSource.createQueryRunner();
    let transactionStarted = false;

    try {
      await runner.connect();
      await runner.startTransaction();
      transactionStarted = true;

      const company = await this.companyRepository.createAndSaveItem(
        {
          name: dto.name,
          businessNumber: dto.businessNumber,
          email: dto.email || dto.adminEmail,
          phone: dto.phone,
        } as Partial<CompanyEntity>,
        runner,
      );

      const admin = await this.userRepository.createAndSaveItem(
        {
          name: dto.adminName,
          email: dto.adminEmail,
          password: hashedPassword,
          role: UserRole.COMPANY_ADMIN,
          companyId: company.id,
        } as Partial<UserEntity>,
        runner,
      );

      await runner.commitTransaction();

      const { password: _password, ...safeAdmin } = admin;

      return apiSuccess('Company and administrator created successfully', {
        company,
        admin: safeAdmin,
      });
    } catch (error) {
      if (transactionStarted) {
        await runner.rollbackTransaction();
      }

      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === '23505'
      ) {
        throw new ConflictException('Administrator email already exists');
      }

      throw error;
    } finally {
      await runner.release();
    }
  }

  async findAll() {
    const companies = await this.companyRepository.findItemMany({
      order: { createdAt: 'DESC' },
    });

    return apiSuccess('Companies retrieved successfully', companies);
  }

  async findOne(id: string, currentUser: AuthPayload) {
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.companyId !== id
    ) {
      throw new ForbiddenException('You cannot access another company');
    }

    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return apiSuccess('Company retrieved successfully', company);
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    Object.assign(company, dto);

    const saved = await this.companyRepository.saveItem(company);

    return apiSuccess('Company updated successfully', saved);
  }

  async remove(id: string) {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepository.softDeleteItem(company);

    return apiSuccess('Company deleted successfully', { id });
  }
}
