import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationTemplates } from './notification.config';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidationService } from '../common/validation/validation.service';
import { Notification } from './entities/Notification.entities';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationGateway,
    private validationService: ValidationService
  ) {}

  async createAndSend({ type, senderId, recipientId, data }: { type: string; senderId: string; recipientId: string; data: Record<string, any> }): Promise<void> {
    if (senderId === recipientId) return;

    const template = NotificationTemplates[type];
    if (!template) throw new Error(`Unknown notification type: ${type}`);

    const sender = await this.prisma.user.findUnique({
      where: { userId: senderId },
      select: { name: true },
    });

    data.senderName = sender?.name ?? 'Someone';
    console.log(data.senderName);
    const message = template.getMessage(data);

    const notification = await this.prisma.notification.create({
      data: {
        type,
        senderId,
        recipientId,
        message,
        ...(data.postId && { postId: data.postId }),
        ...(data.commentId && { commentId: data.commentId }),
      },
    });

    this.gateway.sendToUser(recipientId, {
      id: notification.id,
      message,
      type,
      ...data,
    });
  }

  async getMyNotifications(userId: string): Promise<Notification[]> {
    await this.validationService.validateUserExists(userId);

    const notifications = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        message: true,
        postId: true,
        commentId: true,
        isRead: true,
        createdAt: true,
        sender: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return notifications;
  }
}
