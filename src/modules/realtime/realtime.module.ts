import { Module } from '@nestjs/common';
import { SecurityModule } from '../../libs/core/security';
import { RealtimeGateway } from './realtime/realtime.gateway';

@Module({
  imports: [SecurityModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
