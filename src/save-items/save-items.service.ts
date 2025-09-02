import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidationService } from '../common/validation/validation.service';
import { PaginationService } from '../common/modules/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
import { FilterProductsDto } from '../common/dto/filter-products.dto';
import { FilterService } from '../common/modules/filter/filter.service';
import { ENTITY_TYPES, SaveableEntity, SavedEntity } from './entities/save-items.entity';

@Injectable()
export class SaveItemsService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
    private paginationService: PaginationService,
    private filterService: FilterService
  ) {}

  private getRelationField(entityType: SaveableEntity) {
    return entityType === 'post' ? 'savedPosts' : 'savedProducts';
  }

  private async validateEntityExists(entityType: SaveableEntity, entityId: string) {
    if (entityType === 'post') {
      await this.validationService.validatePostExists(entityId);
    } else {
      await this.validationService.validateProductExists(entityId);
    }
  }

  async save(
    entityType: SaveableEntity,
    entityId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!ENTITY_TYPES.includes(entityType)) {
      throw new BadRequestException('Invalid entity type');
    }

    await this.validateEntityExists(entityType, entityId);

    await this.prisma.user.update({
      where: { userId },
      data: {
        [this.getRelationField(entityType)]: {
          connect: { [`${entityType}Id`]: entityId },
        },
      },
    });

    return {
      success: true,
      message: `${entityType === 'post' ? 'Post' : 'Product'} saved successfully`,
    };
  }

  async unsave(
    entityType: SaveableEntity,
    entityId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!ENTITY_TYPES.includes(entityType)) {
      throw new BadRequestException('Invalid entity type');
    }

    await this.validateEntityExists(entityType, entityId);

    await this.prisma.user.update({
      where: { userId },
      data: {
        [this.getRelationField(entityType)]: {
          disconnect: { [`${entityType}Id`]: entityId },
        },
      },
    });

    return {
      success: true,
      message: `${entityType === 'post' ? 'Post' : 'Product'} removed from saved items successfully`,
    };
  }

  async getSaved(entityType: SaveableEntity, userId: string, filterDto: FilterProductsDto): Promise<PaginatedResponse<SavedEntity>> {
    const relation = this.getRelationField(entityType);
    const paginationOptions = this.paginationService.getPaginationOptions(filterDto);

    const total = await this.prisma.user
      .findUnique({
        where: { userId },
        select: { _count: { select: { [relation]: true } } },
      })
      .then((res) => res?._count?.[relation] || 0);

    const filter = entityType === 'product' ? this.filterService.buildProductFilter(filterDto || {}) : {};

    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        [relation]: {
          skip: paginationOptions.skip,
          take: paginationOptions.limit,
          ...(filter.where ? { where: filter.where } : {}),
          ...(filter.orderBy ? { orderBy: filter.orderBy } : {}),
          ...(entityType === 'post'
            ? {
                select: {
                  postId: true,
                  title: true,
                  content: true,
                  user: {
                    select: {
                      userId: true,
                      name: true,
                      email: true,
                      role: true,
                      isOnline: true,
                    },
                  },
                  products: {
                    where: { active: true },
                    select: {
                      productId: true,
                      name: true,
                      price: true,
                      slug: true,
                      description: true,
                      active: true,
                      createdAt: true,
                      updatedAt: true,
                      categoryId: true,
                      ownerId: true,
                      userUserId: true,
                    },
                  },
                  images: {
                    select: {
                      id: true,
                      url: true,
                      isPrimary: true,
                    },
                  },
                },
                where: {
                  user: { isNot: null },
                },
              }
            : {
                select: {
                  productId: true,
                  name: true,
                  price: true,
                  slug: true,
                  images: {
                    select: { id: true, url: true, isPrimary: true },
                  },
                  category: {
                    select: { categoryId: true, name: true },
                  },
                  owner: {
                    select: {
                      userId: true,
                      name: true,
                      email: true,
                      role: true,
                    },
                  },
                },
              }),
        },
      },
    });

    const data = (user?.[relation] ?? []) as SavedEntity[];

    return this.paginationService.createPaginatedResponse<SavedEntity>(data, total, paginationOptions);
  }
}
