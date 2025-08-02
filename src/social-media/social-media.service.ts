import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSocialMediaDto } from './dto/create-social-media.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { SocialMedia } from './entities/social-media.entity';
import { ValidationService } from '../common/validation/validation.service';

@Injectable()
export class SocialMediaService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService
  ) {}

  async create(userId: string, createSocialMediaDto: CreateSocialMediaDto): Promise<SocialMedia> {
    await this.validationService.validateUserExists(userId);
    return this.prisma.socialMedia.create({
      data: {
        ...createSocialMediaDto,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<SocialMedia[]> {
    await this.validationService.validateUserExists(userId);
    return this.prisma.socialMedia.findMany({
      where: { userId },
    });
  }

  async findOne(id: string): Promise<SocialMedia> {
    const socialMedia = await this.prisma.socialMedia.findUnique({
      where: { id },
    });

    if (!socialMedia) {
      throw new NotFoundException(`Social media with ID ${id} not found`);
    }

    return socialMedia;
  }

  async update(id: string, updateSocialMediaDto: UpdateSocialMediaDto): Promise<SocialMedia> {
    try {
      return await this.prisma.socialMedia.update({
        where: { id },
        data: updateSocialMediaDto,
      });
    } catch (error) {
      throw new NotFoundException(`Social media with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    return this.prisma.socialMedia.delete({
      where: { id },
    });
  }

  async removeAll(userId: string) {
    await this.validationService.validateUserExists(userId);
    const result = await this.prisma.socialMedia.deleteMany({
      where: { userId },
    });
    return {
      message: `Successfully deleted ${result.count} social media links`,
      count: result.count,
    };
  }

  async findByPlatform(userId: string, platform: string): Promise<SocialMedia> {
    await this.validationService.validateUserExists(userId);
    const socialMedia = await this.prisma.socialMedia.findFirst({
      where: {
        userId,
        platform,
      },
    });
    if (!socialMedia) {
      throw new NotFoundException(`Social media with ID ${platform} not found`);
    }
    return socialMedia;
  }
}
