import {
    BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UploadedFileEntity } from '../../libs/database/entity';
import { UploadedFileRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import{
    STORAGE_PROVIDER,
  type StorageProvider,
} from './storage/storage-provider.interface';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class FilesService {
  constructor(
    private readonly uploadedFileRepository: UploadedFileRepository,

    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {}

  async upload(currentUser: AuthPayload, file: Express.Multer.File) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    if (!file) {
      throw new BadRequestException('File is required');
    }
    const stored = await this.storageProvider.upload(file);

    const saved = await this.uploadedFileRepository.createAndSaveItem({
      companyId,
      uploadedBy: currentUser.sub,
      originalName: file.originalname,
      storedName: stored.storedName,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageType: stored.storageType,
      filePath: stored.filePath,
      fileUrl: stored.fileUrl,
    } as Partial<UploadedFileEntity>);

    return apiSuccess('File uploaded successfully', saved);
  }

  async findAll(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const files = await this.uploadedFileRepository.findByCompanyId(companyId);

    return apiSuccess('Files retrieved successfully', files);
  }

  async remove(currentUser: AuthPayload, id: string) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const file = await this.uploadedFileRepository.findItemOne({
      where: {
        id,
        companyId,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.storageProvider.delete(file.filePath);
    await this.uploadedFileRepository.softDeleteItem(file);

    return apiSuccess('File deleted successfully', { id });
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
