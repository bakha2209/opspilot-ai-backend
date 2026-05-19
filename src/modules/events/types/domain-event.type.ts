import { EventNameType } from '../constants/event-name.constant';

export type DomainEvent<TPayload = any> = {
  eventId: string;
  eventName: EventNameType;
  occurredAt: string;
  companyId?: string | null;
  actorId?: string | null;
  payload: TPayload;
};
