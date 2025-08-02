import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationRequestDto } from './dto/recommendation-request.dto';
import { Prisma, TypeEnum } from '@prisma/client';
import { Recommendation } from './entites/recommendation.entity';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userId: string, dto: RecommendationRequestDto, type: 'product' | 'post'): Promise<Recommendation> {
    const userPref = await this.getUserPreferences(userId, dto);

    const data = type === 'product' ? await this.getProductRecommendations(userPref) : await this.getPostRecommendations(userPref);

    return {
      status: 'success',
      message: `${type[0].toUpperCase() + type.slice(1)} recommendations generated successfully`,
      data: {
        recommendations: data,
        user_id: userId,
        recommendation_type: type,
        generated_at: new Date().toISOString(),
      },
    };
  }

  private async getUserPreferences(userId: string, dto: RecommendationRequestDto) {
    if (dto.preferred_industries?.length) return dto;

    const stored = await this.prisma.userPreference.findUnique({ where: { userId } });
    return stored
      ? {
          ...dto,
          preferred_industries: stored.industries,
          preferred_supplier_type: stored.supplierType ?? undefined,
        }
      : dto;
  }

  private async getProductRecommendations(preferences: RecommendationRequestDto) {
    return this.prisma.product.findMany({
      where: {
        category: preferences.preferred_industries?.length ? { name: { in: preferences.preferred_industries } } : undefined,
        owner: preferences.preferred_supplier_type ? { type: preferences.preferred_supplier_type.toUpperCase() as TypeEnum } : undefined,
      },
      select: {
        productId: true,
        name: true,
        slug: true,
        price: true,
        currencyCode: true,
        rating: true,
        images: {
          select: {
            url: true,
            isPrimary: true,
          },
        },
        owner: {
          select: {
            userId: true,
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },

      take: 10,
    });
  }

  private async getPostRecommendations(preferences: RecommendationRequestDto) {
    const filters: Prisma.PostWhereInput[] = [];

    if (preferences.preferred_industries?.length) {
      filters.push({
        products: {
          some: {
            category: {
              name: { in: preferences.preferred_industries },
            },
          },
        },
      });
    }

    if (preferences.keywords?.length) {
      const keywordFilters: Prisma.PostWhereInput[] = preferences.keywords.flatMap((kw) => [
        {
          title: {
            contains: kw,
            mode: 'insensitive',
          },
        },
        { content: { contains: kw, mode: 'insensitive' } },
      ]);

      filters.push({ OR: keywordFilters });
    }

    const where: Prisma.PostWhereInput | undefined = filters.length ? { AND: filters } : undefined;

    return this.prisma.post.findMany({
      where,
      take: 10,
      include: {
        user: { select: { userId: true, name: true } },
        products: true,
        images: true,
      },
    });
  }
}
