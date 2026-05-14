import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
