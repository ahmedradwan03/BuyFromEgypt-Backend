import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto, ChatResponse } from './dto/chatbot.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async handleChatMessage(@Body() body: ChatMessageDto): Promise<ChatResponse> {
    return this.chatbotService.sendMessage(body);
  }

  @Post('chat/reset')
  @HttpCode(HttpStatus.OK)
  async resetConversation(@Query('session_id') sessionId: string): Promise<any> {
    return this.chatbotService.resetConversation(sessionId);
  }

  @Get('industry/:name')
  async getIndustryInfo(@Param('name') industryName: string): Promise<any> {
    return this.chatbotService.getIndustryInfo(industryName);
  }
}
