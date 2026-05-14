import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { WarehouseEntity } from '../../libs/database/entity';
import { WarehouseRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class WarehousesService {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async create(currentUser: AuthPayload, dto: CreateWarehouseDto) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const existing = await this.warehouseRepository.findByCodeAndCompanyId(
      dto.code,
      companyId,
    );

    if (existing) {
      throw new ConflictException(
        'Warehouse code already exists in this company',
      );
    }

    const warehouse = await this.warehouseRepository.createAndSaveItem({
      ...dto,
      companyId,
    } as Partial<WarehouseEntity>);

    return apiSuccess('Warehouse created successfully', warehouse);
  }

  async findAll(currentUser: AuthPayload) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const warehouses = await this.warehouseRepository.findItemMany({
        order: { createdAt: 'DESC' },
      });

      return apiSuccess('Warehouses retrieved successfully', warehouses);
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);
    const warehouses =
      await this.warehouseRepository.findByCompanyId(companyId);

    return apiSuccess('Warehouses retrieved successfully', warehouses);
  }

  async findOne(currentUser: AuthPayload, id: string) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const warehouse = await this.warehouseRepository.findItemOne({
        where: { id },
      });

      if (!warehouse) {
        throw new NotFoundException('Warehouse not found');
      }

      return apiSuccess('Warehouse retrieved successfully', warehouse);
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);

    const warehouse = await this.warehouseRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in your company');
    }

    return apiSuccess('Warehouse retrieved successfully', warehouse);
  }

  async update(currentUser: AuthPayload, id: string, dto: UpdateWarehouseDto) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const warehouse = await this.warehouseRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in your company');
    }

    if (dto.code && dto.code !== warehouse.code) {
      const existing = await this.warehouseRepository.findByCodeAndCompanyId(
        dto.code,
        companyId,
      );

      if (existing) {
        throw new ConflictException(
          'Warehouse code already exists in this company',
        );
      }
    }

    Object.assign(warehouse, dto);

    const saved = await this.warehouseRepository.saveItem(warehouse);

    return apiSuccess('Warehouse updated successfully', saved);
  }

  async remove(currentUser: AuthPayload, id: string) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const warehouse = await this.warehouseRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in your company');
    }

    await this.warehouseRepository.softDeleteItem(warehouse);

    return apiSuccess('Warehouse deleted successfully', { id });
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
