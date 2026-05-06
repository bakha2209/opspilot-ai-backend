import { Module } from '@nestjs/common';
import { CompanyRepository, UserRepository } from './repository';

@Module({
  providers: [CompanyRepository, UserRepository],
  exports: [CompanyRepository, UserRepository],
})
export class DatabaseModule {}