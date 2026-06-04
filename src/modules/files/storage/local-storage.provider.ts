import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { StorageProvider } from './storage-provider.interface';
import { StorageResult } from './storage-result.type';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly configService: ConfigService) {}

  async upload(file: Express.Multer.File): Promise<StorageResult> {
    const uploadPath =
      this.configService.get<string>('UPLOAD_PATH') || 'uploads';

    await fs.mkdir(uploadPath, { recursive: true });

    const ext = path.extname(file.originalname);
    const storedName = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadPath, storedName);

    await fs.writeFile(filePath, file.buffer);

    return {
      storedName,
      filePath,
      fileUrl: `/${filePath.replace(/\\/g, '/')}`,
      storageType: 'local',
    };
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing file
    }
  }
}
