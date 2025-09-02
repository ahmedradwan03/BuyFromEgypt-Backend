import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPreferenceDto } from './dto/user-preference.dto';

@Injectable()
export class UserPreferenceService {
  constructor(private prisma: PrismaService) {}

  async upsertPreference(dto: UserPreferenceDto) {
    const { userId, ...data } = dto;

    return this.prisma.userPreference.upsert({
      where: { userId },
      update: { ...data },
      create: { userId, ...data },
    });
  }

  async getMyPreference(userId: string) {
    return this.prisma.userPreference.findUnique({
      where: { userId },
    });
  }
}
