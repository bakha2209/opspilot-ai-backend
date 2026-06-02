import { Module } from '@nestjs/common';
import {
  CompanyRepository,
  InventoryRepository,
  NotificationRepository,
  ProductRepository,
  ReorderRequestRepository,
  StockMovementRepository,
  UserRepository,
  WarehouseRepository,
} from './repository';
import { SecurityModule } from '../core/security';
import { DatabaseSeederService, DemoDataSeeder, SuperAdminSeeder } from './seeder';

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
    ReorderRequestRepository,
    DemoDataSeeder,
    SuperAdminSeeder,
  ],
  exports: [
    CompanyRepository,
    UserRepository,
    WarehouseRepository,
    ProductRepository,
    InventoryRepository,
    StockMovementRepository,
    NotificationRepository,
    ReorderRequestRepository,
  ],
})
export class DatabaseModule {}
