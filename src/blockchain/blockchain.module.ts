import { Module } from '@nestjs/common';
import { BlockchainController } from './controllers/blokchain.controller';
import { BlockchainService } from './services/blokchain.service';
import { FabricGatewayService } from './fabric/fabric-gateway.service';
import { BlockchainPublisherService } from './services/blkchain-publisher.service';
import { BlockchainAnchorWorker } from './workers/blokchain-anchor.worker';

@Module({
  imports: [],
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    FabricGatewayService,
    BlockchainPublisherService,
    BlockchainAnchorWorker,
  ],
  exports: [
    BlockchainService,
    FabricGatewayService,
    BlockchainPublisherService,
    BlockchainAnchorWorker,
  ],
})
export class BlockchainModule {}
