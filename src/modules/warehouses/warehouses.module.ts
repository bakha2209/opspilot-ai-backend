import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { SecurityModule } from '../../libs/core/security';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
