import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from '../../libs/database/repository';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class CompaniesService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async create(dto: CreateCompanyDto) {
    const saved = await this.companyRepository.createAndSaveItem(dto);

    return apiSuccess('Company created successfully', saved);
  }

  async findAll() {
    const companies = await this.companyRepository.findItemMany({
      order: { createdAt: 'DESC' },
    });

    return apiSuccess('Companies retrieved successfully', companies);
  }

  async findOne(id: string) {
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