import { Module } from '@nestjs/common';
import { BlockchainController } from './controllers/blokchain.controller';
import { BlockchainService } from './services/blokchain.service';
import { FabricGatewayService } from './fabric/fabric-gateway.service';
import { BlockchainPublisherService } from './services/blkchain-publisher.service';
import { BlockchainAnchorWorker } from './workers/blokchain-anchor.worker';
import { DatabaseModule } from '../libs/database/database.module';
import { BlockchainAnchorProcessor } from './services/blockchain-anchor.processor';

@Module({
  imports: [DatabaseModule],
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    FabricGatewayService,
    BlockchainPublisherService,
    BlockchainAnchorWorker,
    BlockchainAnchorProcessor,
  ],
  exports: [
    BlockchainService,
    FabricGatewayService,
    BlockchainPublisherService,
    BlockchainAnchorWorker,
  ],
})
export class BlockchainModule {}
