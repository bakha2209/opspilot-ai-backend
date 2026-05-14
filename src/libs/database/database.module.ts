import { Module } from '@nestjs/common';
import {
  CompanyRepository,
  ProductRepository,
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
    ProductRepository,
    WarehouseRepository,
    SuperAdminSeeder,
    DatabaseSeederService,
  ],
  exports: [
    CompanyRepository,
    UserRepository,
    WarehouseRepository,
    ProductRepository,
  ],
})
export class DatabaseModule {}
