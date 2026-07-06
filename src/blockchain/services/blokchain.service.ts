import { Injectable } from '@nestjs/common';
import { CreateAuditAnchorDto } from '../dto/create-audit-anchor.dto';
import { FabricGatewayService } from '../fabric/fabric-gateway.service';

@Injectable()
export class BlockchainService {
  constructor(private readonly fabricGatewayService: FabricGatewayService) {}

  async createAuditAnchor(dto: CreateAuditAnchorDto) {
    return this.fabricGatewayService.createAuditAnchor(dto);
  }

  async getAuditAnchor(eventId: string) {
    return this.fabricGatewayService.getAuditAnchor(eventId);
  }

  async verifyAuditAnchor(eventId: string, payloadHash: string) {
    return this.fabricGatewayService.verifyAuditAnchor(eventId, payloadHash);
  }
}
