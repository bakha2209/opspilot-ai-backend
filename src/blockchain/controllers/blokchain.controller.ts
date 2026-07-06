import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateAuditAnchorDto } from '../dto/create-audit-anchor.dto';
import { BlockchainService } from '../services/blokchain.service';
import { FabricGatewayService } from '../fabric/fabric-gateway.service';

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
      data: await this.blockchainService.verifyAuditAnchor(eventId, payloadHash),
    };
  }
}
