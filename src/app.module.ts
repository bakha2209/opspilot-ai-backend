import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { AuditLogEntity, CompanyEntity, InventoryEntity, NotificationEntity, ProductEntity, ReorderRequestEntity, StockMovementEntity, UserEntity, WarehouseEntity } from './libs/database/entity';
import { DatabaseModule } from './libs/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StockMovementsModule } from './modules/stock-movements/stock-movements.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { EventsModule } from './modules/events/events.module';
import { ReorderRequestsModule } from './modules/reorder-requests/reorder-requests.module';
import { AiCopilotModule } from './modules/ai-copilot/ai-copilot.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { CacheModule } from './modules/cache/cache.module';
import { FilesModule } from './modules/files/files.module';
import { UploadedFileEntity } from './libs/database/entity/uploaded-file.entity';
import { JobsModule } from './modules/jobs/jobs.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { CompanyIntegrationEntity } from './libs/database/entity/company-integration.entity';
import { CompanyIntegrationsModule } from './modules/company-integrations/company-integrations.module';
import { AiInternalModule } from './modules/ai-internal/ai-internal.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { AiConversationEntity } from './libs/database/entity/ai-conversation.entity';
import { AiMessageEntity } from './libs/database/entity/ai-message.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const synchronize =
          configService.get<string>('DB_SYNCHRONIZE') === 'true';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [
            CompanyEntity,
            UserEntity,
            WarehouseEntity,
            ProductEntity,
            InventoryEntity,
            StockMovementEntity,
            NotificationEntity,
            ReorderRequestEntity,
            AuditLogEntity,
            UploadedFileEntity,
            CompanyIntegrationEntity,
            AiConversationEntity,
            AiMessageEntity,
          ],
          synchronize,
        };
      },
    }),

    CompaniesModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    WarehousesModule,
    ProductsModule,
    InventoryModule,
    StockMovementsModule,
    NotificationsModule,
    RealtimeModule,
    EventsModule,
    ReorderRequestsModule,
    AiCopilotModule,
    DashboardModule,
    AuditLogsModule,
    CacheModule,
    FilesModule,
    JobsModule,
    TelegramModule,
    CompanyIntegrationsModule,
    AiInternalModule,
    AiChatModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
