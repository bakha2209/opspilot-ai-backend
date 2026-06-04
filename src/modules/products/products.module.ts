import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SecurityModule } from '../../libs/core/security';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, SecurityModule,AuditLogsModule,CacheModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
