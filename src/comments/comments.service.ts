import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { RoleEnum } from '../common/enums/role.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../common/enums/Notification.enum';
import { ValidationService } from '../common/validation/validation.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
    private notificationService: NotificationService
  ) {}

  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const { content, postId } = createCommentDto;

    const post = await this.prisma.post.findUnique({
      where: { postId },
      include: {
        user: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    await this.notificationService.createAndSend({
      type: NotificationType.COMMENT_POST,
      senderId: userId,
      recipientId: post.user.userId,
      data: {},
    });

    return comment;
  }

  async update(commentId: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new NotFoundException('You can only edit your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { commentId },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async delete(commentId: string, userId: string, role: string): Promise<{ message: string }> {
    const comment = await this.prisma.comment.findUnique({
      where: { commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId && role !== RoleEnum.ADMIN) {
      throw new NotFoundException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { commentId },
    });
    return { message: 'Comment deleted successfully' };
  }

  async findById(commentId: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { commentId },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async getAll(postId: string): Promise<Comment[]> {
    await this.validationService.validatePostExists(postId);

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return comments;
  }
}
