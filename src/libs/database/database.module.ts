import { Module } from '@nestjs/common';
import {
  AuditLogRepository,
  CompanyIntegrationRepository,
  CompanyRepository,
  InventoryRepository,
  NotificationRepository,
  ProductRepository,
  ReorderRequestRepository,
  StockMovementRepository,
  UploadedFileRepository,
  UserRepository,
  WarehouseRepository,
} from './repository';
import { SecurityModule } from '../core/security';
import {
  DatabaseSeederService,
  DemoDataSeeder,
  SuperAdminSeeder,
} from './seeder';

@Module({
  imports: [SecurityModule],
  providers: [
    CompanyRepository,
    CompanyIntegrationRepository,
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
    UploadedFileRepository,
  ],
  exports: [
    CompanyRepository,
    CompanyIntegrationRepository,
    UserRepository,
    WarehouseRepository,
    ProductRepository,
    InventoryRepository,
    StockMovementRepository,
    NotificationRepository,
    ReorderRequestRepository,
    AuditLogRepository,
    UploadedFileRepository,
  ],
})
export class DatabaseModule {}
