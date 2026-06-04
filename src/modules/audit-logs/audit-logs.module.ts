import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule,SecurityModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
