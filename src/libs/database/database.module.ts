import { Module } from '@nestjs/common';
import {
  CompanyRepository,
  InventoryRepository,
  NotificationRepository,
  ProductRepository,
  StockMovementRepository,
  UserRepository,
  WarehouseRepository,
} from './repository';
import { SecurityModule } from '../core/security';
import { DatabaseSeederService, SuperAdminSeeder } from './seeder';

@Module({
  imports: [SecurityModule],
  providers: [
    CompanyRepository,
    UserRepository,
    ProductRepository,
    WarehouseRepository,
    SuperAdminSeeder,
    DatabaseSeederService,
    InventoryRepository,
    StockMovementRepository,
    NotificationRepository,
  ],
  exports: [
    CompanyRepository,
    UserRepository,
    WarehouseRepository,
    ProductRepository,
    InventoryRepository,
    StockMovementRepository,
    NotificationRepository,
  ],
})
export class DatabaseModule {}
