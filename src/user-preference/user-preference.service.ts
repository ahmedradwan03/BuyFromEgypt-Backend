import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPreferenceDto } from './dto/user-preference.dto';
import { ValidationService } from '../common/validation/validation.service';

@Injectable()
export class UserPreferenceService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService
  ) {}

  async upsertPreference(userPreferenceDto: UserPreferenceDto) {
    const { userId, ...data } = userPreferenceDto;
    await this.validationService.validateUserExists(userId);
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: { ...data },
      create: { userId, ...data },
    });
  }

  async getMyPreference(userId: string) {
    await this.validationService.validateUserExists(userId);
    return this.prisma.userPreference.findUnique({
      where: { userId },
    });
  }
}
