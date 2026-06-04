import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  NotificationEntity,
  NotificationType,
} from '../../libs/database/entity';
import { NotificationRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { apiSuccess } from '../../common/utils/api-response.utils';
import { RealtimeGateway } from '../realtime/realtime/realtime.gateway';
import { JobsService } from '../jobs/jobs.service';

type CreateNotificationInput = {
  companyId: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any> | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly jobsService: JobsService,
  ) {}

  async createSystemNotification(input: CreateNotificationInput) {
    const notification = await this.notificationRepository.createAndSaveItem({
      companyId: input.companyId,
      userId: input.userId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? null,
      isRead: false,
    } as Partial<NotificationEntity>);

    this.realtimeGateway.emitNotificationToCompany(input.companyId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    await this.jobsService.addNotificationCreatedJob({
      notificationId: notification.id,
      companyId: notification.companyId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
    });

    return notification;
  }

  async findAll(currentUser: AuthPayload) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const notifications = await this.notificationRepository.findItemMany({
        order: { createdAt: 'DESC' },
      });

      return apiSuccess('Notifications retrieved successfully', notifications);
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);
    const notifications =
      await this.notificationRepository.findByCompanyId(companyId);

    return apiSuccess('Notifications retrieved successfully', notifications);
  }

  async findUnread(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const notifications =
      await this.notificationRepository.findUnreadByCompanyId(companyId);

    return apiSuccess(
      'Unread notifications retrieved successfully',
      notifications,
    );
  }

  async markAsRead(currentUser: AuthPayload, id: string) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const notification = await this.notificationRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!notification) {
      throw new NotFoundException('Notification not found in your company');
    }

    notification.isRead = true;

    const saved = await this.notificationRepository.saveItem(notification);

    return apiSuccess('Notification marked as read', saved);
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
