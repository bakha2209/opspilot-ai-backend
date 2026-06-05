import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { CompanyIntegrationsController } from './company-integrations.controller';
import { CompanyIntegrationsService } from './company-integrations.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule,SecurityModule],
  controllers: [CompanyIntegrationsController],
  providers: [CompanyIntegrationsService],
  exports: [CompanyIntegrationsService],
})
export class CompanyIntegrationsModule {}
