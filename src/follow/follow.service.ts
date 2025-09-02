import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Follow } from './entities/follow.entity';
import { ValidationService } from '../common/validation/validation.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../common/enums/Notification.enum';

@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private readonly validationService: ValidationService
  ) {}

  async followUser(followerId: string, followingId: string): Promise<{ message: string; follow?: Follow }> {
    if (followerId === followingId) {
      throw new ConflictException('You cannot follow yourself');
    }

    await this.validationService.validateUserExists(followingId);

    const existingFollow = await this.prisma.follower.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existingFollow) {
      await this.prisma.follower.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });

      await this.prisma.notification.deleteMany({
        where: {
          type: NotificationType.FOLLOW_USER,
          senderId: followerId,
          recipientId: followingId,
        },
      });

      return {
        message: `User ${followerId} has unfollowed user ${followingId}.`,
      };
    }

    const follow = await this.prisma.follower.create({
      data: { followerId, followingId },
      include: {
        follower: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
        following: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    await this.notificationService.createAndSend({
      type: NotificationType.FOLLOW_USER,
      senderId: followerId,
      recipientId: followingId,
      data: {},
    });

    return {
      message: `User ${followerId} is now following user ${followingId}.`,
      follow: {
        id: follow.followId,
        follower: follow.follower,
        following: follow.following,
        createdAt: follow.createdAt,
      },
    };
  }

  async getFollowList(userId: string, role: 'followers' | 'following'): Promise<Follow[]> {
    await this.validationService.validateUserExists(userId);

    const isFollowers = role === 'followers';

    const follows = await this.prisma.follower.findMany({
      where: isFollowers ? { followingId: userId } : { followerId: userId },
      select: {
        followId: true,
        [isFollowers ? 'follower' : 'following']: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
        createdAt: true,
      },
    });

    return follows.map((follow) => ({
      id: follow.followId,
      user: isFollowers ? follow.follower : follow.following,
      createdAt: follow.createdAt,
    }));
  }
}
