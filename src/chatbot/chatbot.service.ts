import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { ChatMessageDto, ChatResponse } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.get<string>('CHATBOT_API_URL') || 'http://localhost:8080';
    this.logger.log(`Chatbot API Base URL: ${this.baseUrl}`);
  }

  async sendMessage(messageDto: ChatMessageDto): Promise<ChatResponse> {
    this.logger.log(`Sending message to chatbot API: ${JSON.stringify(messageDto)}`);
    try {
      const response = await firstValueFrom(this.httpService.post<ChatResponse>(`${this.baseUrl}/chat`, messageDto));
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Error communicating with Chatbot API (sendMessage): ${error.message}`, error.stack);
        this.logger.error(`Response data: ${JSON.stringify(error.response?.data)}`);
        throw new InternalServerErrorException(`Failed to get response from chatbot: ${error.response?.data?.detail || error.message}`);
      }
      this.logger.error(`An unexpected error occurred in sendMessage: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An unexpected error occurred during chatbot communication.');
    }
  }

  async resetConversation(sessionId: string): Promise<any> {
    if (!sessionId) throw new BadRequestException('Session ID is required as a query parameter.');

    this.logger.log(`Resetting conversation for session: ${sessionId}`);
    try {
      const response = await firstValueFrom(this.httpService.post(`${this.baseUrl}/chat/reset?session_id=${sessionId}`));
      this.logger.debug(`Chatbot API reset response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Error communicating with Chatbot API (resetConversation): ${error.message}`, error.stack);
        throw new InternalServerErrorException(`Failed to reset conversation: ${error.response?.data?.detail || error.message}`);
      }
      this.logger.error(`An unexpected error occurred in resetConversation: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An unexpected error occurred during conversation reset.');
    }
  }

  async getIndustryInfo(industryName: string): Promise<any> {
    this.logger.log(`Fetching industry info for: ${industryName}`);
    try {
      const response = await firstValueFrom(this.httpService.get(`${this.baseUrl}/industry/${encodeURIComponent(industryName)}`));
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Error fetching industry info for ${industryName}: ${error.message}`, error.stack);
        throw new InternalServerErrorException(`Failed to get industry information: ${error.response?.data?.detail || error.message}`);
      }
      throw new InternalServerErrorException('An unexpected error occurred fetching industry info.');
    }
  }
}
