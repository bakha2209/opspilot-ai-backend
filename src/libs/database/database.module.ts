import { Module } from '@nestjs/common';
import {
  AiConversationRepository,
  AiMessageRepository,
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
    AiConversationRepository,
    AiMessageRepository,
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
    AiConversationRepository,
    AiMessageRepository,
  ],
})
export class DatabaseModule {}
