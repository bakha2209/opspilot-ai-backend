export const EventName = {
  STOCK_MOVEMENT_CREATED: 'stock.movement.created',
  LOW_STOCK_DETECTED: 'stock.low.detected',
  NOTIFICATION_CREATED: 'notification.created',
  REORDER_REQUEST_CREATED: 'reorder.request.created',
  AI_ANALYSIS_REQUESTED: 'ai.analysis.requested',
} as const;

export type EventNameType = (typeof EventName)[keyof typeof EventName];
