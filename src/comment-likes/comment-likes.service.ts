import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '../common/enums/Notification.enum';
import { NotificationService } from '../notification/notification.service';
import { ValidationService } from '../common/validation/validation.service';
import { CommentLike, UserPreview } from './entities/comment-like.entity';

@Injectable()
export class CommentLikesService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
    private notificationService: NotificationService
  ) {}

  private async getCommentWithAuthor(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { commentId },
      include: { user: { select: { userId: true } } },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  private async getExistingReaction(userId: string, commentId: string) {
    return this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });
  }

  private getUserSelect() {
    return {
      userId: true,
      name: true,
      profileImage: true,
    };
  }

  private async sendNotification({ type, senderId, recipientId, commentId }: { type: NotificationType; senderId: string; recipientId: string; commentId: string }) {
    await this.prisma.notification.deleteMany({
      where: {
        type,
        senderId,
        recipientId,
      },
    });
    await this.notificationService.createAndSend({
      type,
      senderId,
      recipientId,
      data: {},
    });
  }

  async likeComment(userId: string, commentId: string): Promise<{ message: string } | CommentLike> {
    await this.validationService.validateCommentExists(commentId);
    const comment = await this.getCommentWithAuthor(commentId);
    const existing = await this.getExistingReaction(userId, commentId);
    const recipientId = comment.user.userId;
    const isSelf = userId === recipientId;

    if (existing) {
      if (existing.isDislike) {
        const updated = await this.prisma.commentLike.update({
          where: { userId_commentId: { userId, commentId } },
          data: { isDislike: false },
          select: {
            user: { select: this.getUserSelect() },
            comment: true,
          },
        });
        if (!isSelf) {
          await this.sendNotification({
            type: NotificationType.LIKE_COMMENT,
            senderId: userId,
            recipientId,
            commentId,
          });
        }

        return updated;
      } else {
        return this.removeReaction(userId, commentId);
      }
    }

    const created = await this.prisma.commentLike.create({
      data: {
        userId,
        commentId,
        isDislike: false,
      },
      select: {
        user: { select: this.getUserSelect() },
        comment: true,
      },
    });

    if (!isSelf) {
      await this.sendNotification({
        type: NotificationType.LIKE_COMMENT,
        senderId: userId,
        recipientId,
        commentId,
      });
    }

    return created;
  }

  async dislikeComment(userId: string, commentId: string): Promise<{ message: string } | CommentLike> {
    await this.validationService.validateCommentExists(commentId);
    const existing = await this.getExistingReaction(userId, commentId);
    const comment = await this.getCommentWithAuthor(commentId);
    const recipientId = comment.user.userId;
    const isSelf = userId === recipientId;

    if (existing) {
      if (!existing.isDislike) {
        const updated = await this.prisma.commentLike.update({
          where: { userId_commentId: { userId, commentId } },
          data: { isDislike: true },
          select: {
            user: { select: this.getUserSelect() },
            comment: true,
          },
        });

        if (!isSelf) {
          await this.sendNotification({
            type: NotificationType.DISLIKE_COMMENT,
            senderId: userId,
            recipientId,
            commentId,
          });
        }

        return updated;
      } else {
        return this.removeReaction(userId, commentId);
      }
    }

    const created = await this.prisma.commentLike.create({
      data: {
        userId,
        commentId,
        isDislike: true,
      },
      select: {
        user: { select: this.getUserSelect() },
        comment: true,
      },
    });

    if (!isSelf) {
      await this.sendNotification({
        type: NotificationType.DISLIKE_COMMENT,
        senderId: userId,
        recipientId,
        commentId,
      });
    }

    return created;
  }

  async removeReaction(userId: string, commentId: string): Promise<{ message: string }> {
    await this.prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    return { message: 'Reaction removed successfully' };
  }

  async getCommentReactions(commentId: string): Promise<UserPreview[]> {
    await this.validationService.validateCommentExists(commentId);
    const likes = await this.prisma.commentLike.findMany({
      where: { commentId },
      select: {
        user: { select: this.getUserSelect() },
      },
    });
    return likes.map((like) => like.user);
  }

  async getCommentLikesCount(commentId: string): Promise<number> {
    await this.validationService.validateCommentExists(commentId);
    return this.prisma.commentLike.count({
      where: { commentId, isDislike: false },
    });
  }

  async getCommentDislikesCount(commentId: string): Promise<number> {
    await this.validationService.validateCommentExists(commentId);
    return this.prisma.commentLike.count({
      where: { commentId, isDislike: true },
    });
  }
}
