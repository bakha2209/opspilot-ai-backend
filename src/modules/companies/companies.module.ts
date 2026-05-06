import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule,SecurityModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}