/// <reference types="multer" />

import type { StorageResult } from './storage-result.type';

export interface StorageProvider {
  upload(file: Express.Multer.File): Promise<StorageResult>;
  delete(filePath: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
