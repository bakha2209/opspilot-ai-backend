import { Module } from '@nestjs/common';
import { BlockchainController } from './controllers/blokchain.controller';
import { BlockchainService } from './services/blokchain.service';
import { FabricGatewayService } from './fabric/fabric-gateway.service';

@Module({
  imports: [],
  controllers: [BlockchainController],
  providers: [BlockchainService, FabricGatewayService],
  exports: [BlockchainService, FabricGatewayService],
})
export class BlockchainModule {}
