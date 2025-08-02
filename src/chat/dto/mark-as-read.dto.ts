import { IsString } from 'class-validator';

export class MarkAsReadDto {
  @IsString()
  conversationId: string;

  @IsString()
  userId: string;
}