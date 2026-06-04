import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import { CacheModule } from '../cache/cache.module';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule,SecurityModule,CacheModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: LocalStorageProvider,
    },
  ],
  exports: [FilesService],
})
export class FilesModule {}
