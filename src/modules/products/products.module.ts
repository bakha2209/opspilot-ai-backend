import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
