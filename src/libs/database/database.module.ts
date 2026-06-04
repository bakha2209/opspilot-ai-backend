import { Module } from '@nestjs/common';
import {
  AuditLogRepository,
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
    AuditLogRepository,
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
    AuditLogRepository,
  ],
})
export class DatabaseModule {}
