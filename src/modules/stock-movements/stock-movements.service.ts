import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { StockMovementRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class StockMovementsService {
  constructor(
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async findAll(currentUser: AuthPayload) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const movements = await this.stockMovementRepository.findItemMany({
        relations: {
          company: true,
          warehouse: true,
          product: true,
          user: true,
        },
        order: { createdAt: 'DESC' },
      });

      return apiSuccess('Stock movements retrieved successfully', movements);
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);

    const movements =
      await this.stockMovementRepository.findByCompanyId(companyId);

    return apiSuccess('Stock movements retrieved successfully', movements);
  }

  async findByProduct(currentUser: AuthPayload, productId: string) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const movements = await this.stockMovementRepository.findItemMany({
        where: { productId },
        relations: {
          company: true,
          warehouse: true,
          product: true,
          user: true,
        },
        order: { createdAt: 'DESC' },
      });

      return apiSuccess(
        'Product stock movements retrieved successfully',
        movements,
      );
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);

    const movements = await this.stockMovementRepository.findByProductId(
      companyId,
      productId,
    );

    return apiSuccess(
      'Product stock movements retrieved successfully',
      movements,
    );
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
