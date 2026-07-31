import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { SecurityBcryptJsService } from '../../libs/core/security';
import {
  CompanyRepository,
  UserRepository,
} from '../../libs/database/repository';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const companyRepository = {
    createAndSaveItem: jest.fn(),
  };
  const userRepository = {
    findByEmail: jest.fn(),
    createAndSaveItem: jest.fn(),
  };
  const bcryptService = {
    hashPassword: jest.fn(),
  };
  const runner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  } as unknown as QueryRunner;
  const dataSource = {
    createQueryRunner: jest.fn(() => runner),
  };

  const dto: CreateCompanyDto = {
    name: 'TopParts Manufacturing',
    businessNumber: '123-45-67890',
    email: 'contact@topparts.com',
    phone: '+82-10-1234-5678',
    adminName: 'Company Admin',
    adminEmail: 'admin@topparts.com',
    adminPassword: 'StrongPassword123!',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: CompanyRepository, useValue: companyRepository },
        { provide: UserRepository, useValue: userRepository },
        { provide: SecurityBcryptJsService, useValue: bcryptService },
        { provide: DataSource, useValue: dataSource },
      ],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('creates a company and its administrator in one transaction', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    bcryptService.hashPassword.mockResolvedValue('hashed-password');
    companyRepository.createAndSaveItem.mockResolvedValue({
      id: 'company-id',
      name: dto.name,
    });
    userRepository.createAndSaveItem.mockResolvedValue({
      id: 'admin-id',
      name: dto.adminName,
      email: dto.adminEmail,
      password: 'hashed-password',
      role: UserRole.COMPANY_ADMIN,
      companyId: 'company-id',
    });

    const result = await service.create(dto);

    expect(companyRepository.createAndSaveItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: dto.name, email: dto.email }),
      runner,
    );
    expect(userRepository.createAndSaveItem).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.adminEmail,
        password: 'hashed-password',
        role: UserRole.COMPANY_ADMIN,
        companyId: 'company-id',
      }),
      runner,
    );
    expect(runner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(runner.rollbackTransaction).not.toHaveBeenCalled();
    expect(result.data?.admin).not.toHaveProperty('password');
  });

  it('rejects an administrator email that already exists', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('rolls back when administrator creation fails', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    bcryptService.hashPassword.mockResolvedValue('hashed-password');
    companyRepository.createAndSaveItem.mockResolvedValue({ id: 'company-id' });
    userRepository.createAndSaveItem.mockRejectedValue(
      new Error('database failure'),
    );

    await expect(service.create(dto)).rejects.toThrow('database failure');
    expect(runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(runner.commitTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledTimes(1);
  });
});
