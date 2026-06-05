import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type{ AuthPayload } from '../auth/types/auth-payload.type';
import { UpdateCompanyIntegrationDto } from './dto/update-company-integration.dto';
import { CompanyIntegrationsService } from './company-integrations.service';

@ApiTags('Company Integrations')
@ApiBearerAuth()
@Controller('company-integrations') 
export class CompanyIntegrationsController {
  constructor(
    private readonly companyIntegrationsService: CompanyIntegrationsService,
  ) {}

  @Get('me')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get current company integration settings' })
  getMyIntegration(@CurrentUser() currentUser: AuthPayload) {
    return this.companyIntegrationsService.getMyIntegration(currentUser);
  }

  @Patch('me')
  @Auth(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update current company integration settings' })
  updateMyIntegration(
    @CurrentUser() currentUser: AuthPayload,
    @Body() dto: UpdateCompanyIntegrationDto,
  ) {
    return this.companyIntegrationsService.updateMyIntegration(
      currentUser,
      dto,
    );
  }
}
