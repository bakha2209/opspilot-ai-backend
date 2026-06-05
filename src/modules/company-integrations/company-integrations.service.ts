import { ForbiddenException, Injectable } from '@nestjs/common';
import { CompanyIntegrationEntity } from '../../libs/database/entity';
import { CompanyIntegrationRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { UpdateCompanyIntegrationDto } from './dto/update-company-integration.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class CompanyIntegrationsService {
  constructor(
    private readonly companyIntegrationRepository: CompanyIntegrationRepository,
  ) {}

  async getMyIntegration(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const integration = await this.getOrCreate(companyId);

    return apiSuccess(
      'Company integration retrieved successfully',
      integration,
    );
  }

  async updateMyIntegration(
    currentUser: AuthPayload,
    dto: UpdateCompanyIntegrationDto,
  ) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const integration = await this.getOrCreate(companyId);

    if (dto.telegramEnabled !== undefined) {
      integration.telegramEnabled = dto.telegramEnabled;
    }

    if (dto.telegramChatId !== undefined) {
      integration.telegramChatId = dto.telegramChatId;
    }

    const saved = await this.companyIntegrationRepository.saveItem(integration);

    return apiSuccess('Company integration updated successfully', saved);
  }

  async getTelegramTarget(companyId: string): Promise<{
    enabled: boolean;
    chatId: string | null;
  }> {
    const integration =
      await this.companyIntegrationRepository.findByCompanyId(companyId);

    return {
      enabled: integration?.telegramEnabled ?? false,
      chatId: integration?.telegramChatId ?? null,
    };
  }

  private async getOrCreate(companyId: string) {
    const existing =
      await this.companyIntegrationRepository.findByCompanyId(companyId);

    if (existing) return existing;

    return this.companyIntegrationRepository.createAndSaveItem({
      companyId,
      telegramEnabled: false,
      telegramChatId: null,
    } as Partial<CompanyIntegrationEntity>);
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
