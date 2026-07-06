import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { SecurityModule } from '../../libs/core/security';
import { BlockchainModule } from '../../blockchain/blockchain.module';

@Module({
  imports: [DatabaseModule, SecurityModule, BlockchainModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
