import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidationService } from '../common/validation/validation.service';
import { NotificationType } from '../common/enums/Notification.enum';
import { NotificationService } from '../notification/notification.service';
import { Rate, RATEABLE_ENTITIES, RateableEntity } from './entities/rating.entity';
import { RatingInput } from './dto/rating-input.dto';

@Injectable()
export class RatingService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private validationService: ValidationService
  ) {}

  private getIdField(entityType: RateableEntity): 'postId' | 'productId' {
    return `${entityType}Id` as const;
  }

  private async validateEntity(entityType: RateableEntity, entityId: string) {
    const methodName = `validate${entityType.charAt(0).toUpperCase() + entityType.slice(1)}Exists`;
    if (typeof this.validationService[methodName] !== 'function') {
      throw new BadRequestException('Invalid entity type');
    }
    await this.validationService[methodName](entityId);
  }

  private async getRatingAggregate(idField: string, entityId: string) {
    return this.prisma.rating.aggregate({
      where: { [idField]: entityId },
      _avg: { value: true },
      _count: true,
    });
  }

  async rate(
    entityType: RateableEntity,
    { userId, entityId, value, comment }: RatingInput
  ): Promise<
    Rate & {
      message: string;
    }
  > {
    if (!RATEABLE_ENTITIES.includes(entityType)) throw new BadRequestException('Invalid entity type');
    await this.validateEntity(entityType, entityId);

    const idField = this.getIdField(entityType);
    const uniqueWhere = { [`userId_${idField}`]: { userId, [idField]: entityId } };

    await this.prisma.rating.upsert({
      where: uniqueWhere as any,
      update: { value, comment },
      create: { value, comment, userId, [idField]: entityId },
    });

    const { _avg, _count } = await this.getRatingAggregate(idField, entityId);

    let recipientId: string;

    if (entityType === 'post') {
      const updatedPost = await this.prisma.post.update({
        where: { postId: entityId },
        data: {
          rating: _avg.value ?? 0,
          reviewCount: _count,
        },
        include: { user: true },
      });
      recipientId = updatedPost.user.userId;
    } else {
      const updatedProduct = await this.prisma.product.update({
        where: { productId: entityId },
        data: {
          rating: _avg.value ?? 0,
          reviewCount: _count,
        },
        include: { owner: true },
      });
      recipientId = updatedProduct.owner.userId;
    }

    await this.prisma.notification.deleteMany({
      where: { type: NotificationType.RATE_POST, senderId: userId, recipientId },
    });

    await this.notificationService.createAndSend({
      type: NotificationType.RATE_POST,
      senderId: userId,
      recipientId,
      data: {
        rating: value,
      },
    });

    return {
      message: 'Rating updated successfully',
      averageRating: _avg.value ?? 0,
      totalReviews: _count,
      userRating: value,
      comment,
    };
  }

  async getEntityRating(entityType: RateableEntity, entityId: string, userId: string): Promise<Rate> {
    if (!RATEABLE_ENTITIES.includes(entityType)) throw new BadRequestException('Invalid entity type');
    const idField = this.getIdField(entityType);

    const { _avg, _count } = await this.getRatingAggregate(idField, entityId);

    const userRating = await this.prisma.rating.findFirst({
      where: { userId, [idField]: entityId },
      select: {
        value: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return {
      averageRating: _avg.value ?? 0,
      totalReviews: _count,
      userRating: userRating?.value ?? null,
      comment: userRating?.comment ?? null,
      createdAt: userRating?.createdAt ?? null,
      user: userRating?.user ?? null,
    };
  }

  async getAllRatings(entityType: RateableEntity, entityId: string): Promise<Rate[]> {
    if (!RATEABLE_ENTITIES.includes(entityType)) throw new BadRequestException('Invalid entity type');
    const idField = this.getIdField(entityType);

    const [ratings, { _avg, _count }] = await Promise.all([
      this.prisma.rating.findMany({
        where: { [idField]: entityId },
        select: {
          value: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.getRatingAggregate(idField, entityId),
    ]);

    return ratings.map((rating) => ({
      averageRating: _avg.value ?? 0,
      totalReviews: _count,
      userRating: rating.value,
      comment: rating.comment,
      createdAt: rating.createdAt,
      user: rating.user,
    }));
  }
}
