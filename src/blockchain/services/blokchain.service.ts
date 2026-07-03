import { Injectable } from '@nestjs/common';
import { CreateAuditAnchorDto } from '../dto/create-audit-anchor.dto';

@Injectable()
export class BlockchainService {
  async createAuditAnchor(dto: CreateAuditAnchorDto) {
    return {
      eventId: dto.eventId,
      txId: null,
      status: 'PENDING_HYPERLEDGER_INTEGRATION',
      anchoredAt: null,
    };
  }

  async getAuditAnchor(eventId: string) {
    return {
      eventId,
      txId: null,
      status: 'NOT_CONNECTED_YET',
    };
  }

  async verifyAuditAnchor(eventId: string) {
    return {
      eventId,
      verified: false,
      reason: 'Hyperledger connection is not implemented yet',
    };
  }
}
