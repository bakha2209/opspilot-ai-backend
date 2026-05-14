import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SuperAdminSeeder } from './super-admin.seeder';

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(private readonly superAdminSeeder: SuperAdminSeeder) {}

  async onApplicationBootstrap() {
    this.logger.log('Database seeding started');

    await this.superAdminSeeder.seed();

    this.logger.log('Database seeding completed');
  }
}