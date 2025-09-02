import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../common/modules/cloudinary/cloudinary.service';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ValidationService } from '../common/validation/validation.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private validationService: ValidationService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  private extractPublicIdFromUrl(url: string): string | null {
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)\./);
    return match ? match[1] : null;
  }

  async create(userId: string, createCategoryDto: CreateCategoryDto, image?: Express.Multer.File): Promise<Category> {
    await this.validationService.validateUserExists(userId);

    let imageUrl: string | undefined;

    if (image) {
      const uploaded = await this.cloudinaryService.uploadImage(image, `categories`);
      imageUrl = uploaded.url;
    }

    const category = await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        userId,
        image: imageUrl,
      },
      include: {
        user: {
          select: { userId: true, name: true, email: true, role: true, type: true, active: true },
        },
      },
    });
    return category;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Category>> {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: { userId: true, name: true, email: true, role: true, type: true, active: true },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.category.count(),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        NextPage: page < Math.ceil(total / limit),
        PreviousPage: page > 1,
      },
    };
  }

  async findOne(categoryId: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { categoryId },
      include: {
        user: {
          select: { userId: true, name: true, email: true, role: true, type: true, active: true },
        },
      },
    });

    if (!category) throw new NotFoundException(`Category with ID '${categoryId}' not found.`);

    return category;
  }

  async update(categoryId: string, updateCategoryDto: UpdateCategoryDto, image?: Express.Multer.File): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { categoryId } });

    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found.`);
    }

    let imageUrl: string | undefined;
    if (image) {
      if (category.image) {
        const publicId = this.extractPublicIdFromUrl(category.image);
        if (publicId) {
          await this.cloudinaryService.deleteImage(publicId);
        }
      }
      const uploaded = await this.cloudinaryService.uploadImage(image, `categories`);
      imageUrl = uploaded.url;
    }

    const updatedCategory = await this.prisma.category.update({
      where: { categoryId },
      data: { ...updateCategoryDto, image: imageUrl ?? category.image },
      include: {
        user: {
          select: { userId: true, name: true, email: true, role: true, type: true, active: true },
        },
      },
    });

    return updatedCategory;
  }

  async remove(categoryId: string): Promise<{ message: string }> {
    const category = await this.prisma.category.findUnique({ where: { categoryId } });
    if (!category) throw new NotFoundException(`Category with ID '${categoryId}' not found.`);

    if (category.image) {
      const publicId = this.extractPublicIdFromUrl(category.image);
      if (publicId) await this.cloudinaryService.deleteImage(publicId);
    }

    await this.prisma.$transaction(async (prisma) => {
      const products = await prisma.product.findMany({
        where: { categoryId },
        include: { images: true },
      });

      for (const product of products) {
        if (product.images.length > 0) {
          const deleteImagePromises = product.images.map((img) => this.cloudinaryService.deleteImage(img.id).catch((err) => console.error(`Image deletion failed: ${img.id}`, err)));
          await Promise.all(deleteImagePromises);

          await prisma.productImage.deleteMany({ where: { productId: product.productId } });
        }

        if (product.cloudFolder) {
          await this.cloudinaryService.deleteFolder(product.cloudFolder).catch((err) => console.error(`Folder deletion failed: ${product.cloudFolder}`, err));
        }

        await prisma.product.delete({ where: { productId: product.productId } });
      }

      await prisma.category.delete({ where: { categoryId } });
    });

    return { message: `Category '${categoryId}' deleted successfully.` };
  }
}
