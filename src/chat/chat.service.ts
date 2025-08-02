import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { ConversationType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

   private async getOrCreatePrivateConversation(userId1: string, userId2: string) {
    const users = await this.prisma.user.findMany({
      where: { userId: { in: [userId1, userId2] } },
      select: { userId: true },
    });
    const existingUserIds = users.map((user) => user.userId);
    const invalidUserIds = [userId1, userId2].filter((id) => !existingUserIds.includes(id));

    if (invalidUserIds.length > 0) {
      throw new BadRequestException(`Invalid user IDs: ${invalidUserIds.join(', ')}`);
    }
    const conversations = await this.prisma.conversation.findMany({
      where: {
        type: ConversationType.PRIVATE,
        participants: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
      include: { participants: true },
    });

    const conversation = conversations.find((c) => c.participants.length === 2 && c.participants.some((p) => p.userId === userId1) && c.participants.some((p) => p.userId === userId2));

    if (conversation) {
      return conversation;
    }

    const newConversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.PRIVATE,
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: { participants: true },
    });

    return newConversation;
  }

  async createMessage(data: SendMessageDto) {
    if (!data.conversationId && !data.receiverId) {
      throw new BadRequestException('must provide either conversationId or receiverId');
    }

    if (data.conversationId && data.receiverId) {
      throw new BadRequestException('must not provide both conversationId and receiverId');
    }

    let receiverId: string;
    let conversationId: string;

    if (data.conversationId) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          participants: {
            include: {
              user: { select: { userId: true, name: true } },
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('conversation not found');
      }

      const senderParticipant = conversation.participants.find((p) => p.userId === data.senderId);
      if (!senderParticipant) {
        throw new BadRequestException('sender is not a participant in this conversation');
      }

      const receiverParticipant = conversation.participants.find((p) => p.userId !== data.senderId);
      if (!receiverParticipant) {
        throw new BadRequestException('cannot determine receiver');
      }

      receiverId = receiverParticipant.userId;
      conversationId = data.conversationId;
    } else {
      receiverId = data.receiverId!;
      const userIdsToValidate = [data.senderId, receiverId];
      const users = await this.prisma.user.findMany({
        where: { userId: { in: userIdsToValidate } },
        select: { userId: true },
      });

      const existingUserIds = users.map((user) => user.userId);
      const invalidUserIds = userIdsToValidate.filter((id) => !existingUserIds.includes(id));

      if (invalidUserIds.length > 0) {
        throw new BadRequestException(`Invalid user IDs: ${invalidUserIds.join(', ')}`);
      }

      const conversation = await this.getOrCreatePrivateConversation(data.senderId, receiverId);
      conversationId = conversation.id;
    }

    const message = await this.prisma.message.create({
      data: {
        senderId: data.senderId,
        receiverId: receiverId,
        content: data.content,
        messageType: data.messageType,
        conversationId: conversationId,
      },
      include: {
        sender: { select: { userId: true, name: true } },
        receiver: { select: { userId: true, name: true } },
        conversation: true,
      },
    });

    return message;
  }

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                userId: true,
                name: true,
                profileImage: true,
                isOnline: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { userId: true, name: true } },
          },
        },
      },
      orderBy: {
        messages: {
          _count: 'desc',
        },
      },
    });

    return conversations;
  }

  async getMessagesByConversation(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { userId: true, name: true, profileImage: true } },
        receiver: { select: { userId: true, name: true, profileImage: true } },
      },
    });

    return messages;
  }

  async getMessagesBetweenUsers(senderId: string, receiverId: string) {
    const conversation = await this.getOrCreatePrivateConversation(senderId, receiverId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return messages;
  }

  async updateMessageStatus(data: UpdateMessageStatusDto) {
    const updateData: { seen?: boolean; delivered?: boolean } = {};
    if (data.status === 'seen') {
      updateData.seen = true;
      updateData.delivered = true;
    } else if (data.status === 'delivered') {
      updateData.delivered = true;
    }

    return this.prisma.message.update({
      where: { messageId: data.messageId },
      data: updateData,
    });
  }

  async markAllMessagesAsRead(conversationId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        receiverId: userId,
        seen: false,
      },
      data: {
        seen: true,
      },
    });
  }

  async getUnreadMessageSenders(conversationId: string, receiverId: string) {
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        receiverId,
        seen: false,
      },
      distinct: ['senderId'],
      select: {
        sender: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return unreadMessages.map((msg) => msg.sender);
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
      select: { isOnline: true },
    });
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { userId },
      data: { isOnline },
    });
  }
}
