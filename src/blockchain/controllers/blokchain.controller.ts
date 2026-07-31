import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../../modules/auth/decorators/auth.decorator';
import { CurrentUser } from '../../modules/auth/decorators/current-user.decorator';
import type { AuthPayload } from '../../modules/auth/types/auth-payload.type';
import { CreateAuditAnchorDto } from '../dto/create-audit-anchor.dto';
import { BlockchainService } from '../services/blokchain.service';
import { FabricGatewayService } from '../fabric/fabric-gateway.service';

@ApiBearerAuth()
@Auth(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly fabricGatewayService: FabricGatewayService,
  ) {}

  @Get('fabric/test')
  async testFabric() {
    return {
      success: true,
      data: await this.fabricGatewayService.testConnection(),
    };
  }

  @Post('audit-anchor')
  async createAuditAnchor(@Body() dto: CreateAuditAnchorDto) {
    return {
      success: true,
      message: 'Audit anchor created',
      data: await this.blockchainService.createAuditAnchor(dto),
    };
  }

  @Get('audit-anchor/:eventId')
  async getAuditAnchor(@Param('eventId') eventId: string) {
    return {
      success: true,
      message: 'Audit anchor fetched',
      data: await this.blockchainService.getAuditAnchor(eventId),
    };
  }

  @Post('audit-anchor/:eventId/verify')
  async verifyAuditAnchor(
    @Param('eventId') eventId: string,
    @Body('payloadHash') payloadHash: string,
  ) {
    return {
      success: true,
      message: 'Audit anchor verified',
      data: await this.blockchainService.verifyAuditAnchor(
        eventId,
        payloadHash,
      ),
    };
  }

  @Get('event/:eventId')
  async getBlockchainEvent(@Param('eventId') eventId: string) {
    return {
      success: true,
      message: 'Blockchain event retrieved',
      data: await this.blockchainService.getBlockchainEvent(eventId),
    };
  }

  @Get('audit/:auditLogId/details')
  async getAuditEventDetails(
    @CurrentUser() currentUser: AuthPayload,
    @Param('auditLogId') auditLogId: string,
  ) {
    return {
      success: true,
      message: 'Blockchain audit event details retrieved',
      data: await this.blockchainService.getAuditEventDetails(
        currentUser,
        auditLogId,
      ),
    };
  }

  @Post('audit/:auditLogId/verify')
  async verifyAuditEvent(
    @CurrentUser() currentUser: AuthPayload,
    @Param('auditLogId') auditLogId: string,
  ) {
    return {
      success: true,
      message: 'Blockchain audit event verified',
      data: await this.blockchainService.verifyAuditEvent(
        currentUser,
        auditLogId,
      ),
    };
  }

  @Post('event/:eventId/verify')
  async verifyBlockchainEvent(
    @Param('eventId') eventId: string,
    @Body('payloadHash') payloadHash: string,
  ) {
    return {
      success: true,
      message: 'Blockchain event verified',
      data: await this.blockchainService.verifyBlockchainEvent(
        eventId,
        payloadHash,
      ),
    };
  }

  @Post('retry/:auditLogId')
  async retryAuditAnchor(
    @CurrentUser() currentUser: AuthPayload,
    @Param('auditLogId') auditLogId: string,
  ) {
    return {
      success: true,
      message: 'Blockchain anchor retry queued',
      data: await this.blockchainService.retryAuditAnchor(
        currentUser,
        auditLogId,
      ),
    };
  }

  @Post('retry-all')
  async retryAllFailedAuditAnchors(
    @CurrentUser() currentUser: AuthPayload,
  ) {
    return {
      success: true,
      message: 'Failed blockchain anchors requeued',
      data: await this.blockchainService.retryAllFailedAuditAnchors(
        currentUser,
      ),
    };
  }

  @Get('statistics')
  async statistics(@CurrentUser() currentUser: AuthPayload) {
    return {
      success: true,
      data: await this.blockchainService.getStatistics(currentUser),
    };
  }

  @Get('health')
  async health() {
    return {
      success: true,
      data: await this.blockchainService.health(),
    };
  }
}
