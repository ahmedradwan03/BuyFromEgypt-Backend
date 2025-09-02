import { Controller, Get, Post, Patch, Body, Query, Logger, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';

@Controller('chat')
export class ChatController {
  private logger = new Logger('ChatController');

  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Query('userId') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('messages')
  async getMessages(@Query() query: GetMessagesDto) {
    if (query.conversationId) {
      return this.chatService.getMessagesByConversation(query.conversationId);
    }
    return this.chatService.getMessagesBetweenUsers(query.senderId!, query.receiverId!);
  }

  @Post('sendMessage')
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.createMessage(dto);
  }

  @Patch('updateMessage')
  async updateMessage(@Body() dto: UpdateMessageStatusDto) {
    return this.chatService.updateMessageStatus(dto);
  }

  @Patch('markAsRead')
  async markAsRead(@Body() dto: MarkAsReadDto) {
    return this.chatService.markAllMessagesAsRead(dto.conversationId, dto.userId);
  }

  @Get('onlineStatus')
  async getUserOnlineStatus(@Query('userId') userId: string) {
    const user = await this.chatService.getUserById(userId);
    return { userId, isOnline: user?.isOnline ?? false };
  }
}
