import { Module } from '@nestjs/common';
import {
  CompanyRepository,
  UserRepository,
  WarehouseRepository,
} from './repository';
import { SecurityModule } from '../core/security';
import { DatabaseSeederService, SuperAdminSeeder } from './seeder';

@Module({
  imports: [SecurityModule],
  providers: [
    CompanyRepository,
    UserRepository,
    SuperAdminSeeder,
    DatabaseSeederService,
    WarehouseRepository,
  ],
  exports: [CompanyRepository, UserRepository, WarehouseRepository],
})
export class DatabaseModule {}
