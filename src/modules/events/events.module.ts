import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsConsumer } from './events.consumer';

@Module({
  providers: [EventsService, EventsConsumer],
  exports: [EventsService],
})
export class EventsModule {}
