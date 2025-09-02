import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CloudinaryService } from '../common/modules/cloudinary/cloudinary.service';
import { v4 as uuid } from 'uuid';
import { RoleEnum } from '../common/enums/role.enum';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Post } from './entities/post.entity';
import { UploadedImageInfo } from './entities/post-image.entity';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private readonly httpService: HttpService
  ) {}

  private async uploadImages(files: Express.Multer.File[], folder: string): Promise<UploadedImageInfo[]> {
    if (!files?.length) return [];
    return await this.cloudinaryService.uploadImages(files, folder); // Let cloudinary throw its own errors
  }

  private async deleteImages(images: { id: string }[]) {
    for (const image of images) {
      try {
        await this.cloudinaryService.deleteImage(image.id);
      } catch (error) {
        console.warn(`Failed to delete image ${image.id}: ${error.message}`);
      }
    }
  }

  async create(userId: string, createPostDto: CreatePostDto, files: Express.Multer.File[]): Promise<Post> {
    const cloudFolder = `${process.env.SITE_NAME}/posts/${uuid()}`;
    const uploadedImages = await this.uploadImages(files, cloudFolder);

    const productIds = Array.isArray(createPostDto.products) ? createPostDto.products : createPostDto.products ? [createPostDto.products] : [];

    if (productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true },
      });

      const foundIds = products.map((p) => p.productId);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      if (missingIds.length) {
        try {
          await this.cloudinaryService.deleteFolder(cloudFolder);
        } catch (cleanupError) {
          console.error('Failed to clean up cloud folder:', cleanupError);
        }
        throw new NotFoundException(`Products with IDs ${missingIds.join(', ')} not found`);
      }
    }

    const postData = {
      ...createPostDto,
      userId,
      cloudFolder,
      images: {
        create: uploadedImages.map((img) => ({
          url: img.url,
          id: img.id,
        })),
      },
      products: productIds.length ? { connect: productIds.map((productId) => ({ productId })) } : undefined,
    };

    return this.prisma.post.create({
      data: postData,
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            role: true,
            isOnline: true,
            profileImage: true,
          },
        },
        images: true,
        products: {
          select: {
            productId: true,
            name: true,
            description: true,
            price: true,
            owner: {
              select: {
                userId: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Post>> {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = (paginationDto as any)?.userId;

    if (userId && process.env.CHATBOT_API_URL) {
      try {
        const url = `${process.env.CHATBOT_API_URL}/api/v1/recommendation/posts?user_id=${userId}`;
        const { data } = await firstValueFrom(this.httpService.post(url, paginationDto));

        const recommendations = data?.data?.recommendations || [];
        const paginated = recommendations.slice(skip, skip + limit);
        const total = recommendations.length;
        const totalPages = Math.ceil(total / limit);

        return {
          data: paginated,
          meta: {
            total,
            page,
            limit,
            totalPages,
            NextPage: page < totalPages,
            PreviousPage: page > 1,
          },
        };
      } catch (err) {
        console.error('Recommendation API failed:', err?.message || err);
      }
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              userId: true,
              name: true,
              email: true,
              role: true,
              isOnline: true,
              profileImage: true,
            },
          },
          images: true,
          products: {
            select: {
              productId: true,
              name: true,
              description: true,
              price: true,
              owner: {
                select: {
                  userId: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          comments: {
            select: {
              commentId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count(),
    ]);

    const mappedPosts: Post[] = posts.map((post) => {
      const { comments, ...rest } = post;
      return {
        ...rest,
        comments_count: comments.length,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: mappedPosts,
      meta: {
        total,
        page,
        limit,
        totalPages,
        NextPage: page < totalPages,
        PreviousPage: page > 1,
      },
    };
  }

  async findOne(postId: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { postId },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
            email: true,
            role: true,
            isOnline: true,
          },
        },
        images: true,
        products: {
          select: {
            productId: true,
            name: true,
            description: true,
            price: true,
            owner: {
              select: {
                userId: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        comments: {
          select: {
            commentId: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const { comments, ...rest } = post;

    return {
      ...rest,
      comments_count: comments.length,
    };
  }

  async update(postId: string, userId: string, updatePostDto: UpdatePostDto, files?: Express.Multer.File[]): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { postId },
      include: {
        user: { select: { userId: true, name: true, profileImage: true, email: true, role: true, isOnline: true } },
        products: {
          select: {
            productId: true,
            name: true,
            description: true,
            price: true,
            owner: { select: { userId: true, name: true, email: true, role: true } },
          },
        },
        images: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    if (post.userId !== userId) {
      throw new ForbiddenException("You don't have permission to update this post");
    }

    if (files?.length && post.images.length) {
      await this.deleteImages(post.images);
      await this.prisma.postImage.deleteMany({ where: { postId } });
    }

    const uploadedImages = await this.uploadImages(files ?? [], post.cloudFolder);

    const updateData: any = {
      ...(updatePostDto.title && { title: updatePostDto.title }),
      ...(updatePostDto.content && { content: updatePostDto.content }),
    };

    if (uploadedImages.length) {
      updateData.images = {
        create: uploadedImages.map((img: any) => ({
          url: img.url,
          id: img.id,
        })),
      };
    }

    const updatedPost = await this.prisma.post.update({
      where: { postId },
      data: updateData,
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            role: true,
            isOnline: true,
            profileImage: true,
          },
        },
        images: true,
        products: {
          select: {
            productId: true,
            name: true,
            description: true,
            price: true,
            owner: {
              select: {
                userId: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return updatedPost;
  }

  async remove(postId: string, userId: string, role: string): Promise<{ message: string }> {
    const post = await this.prisma.post.findUnique({
      where: { postId },
      include: {
        images: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    if (post.userId !== userId && role !== RoleEnum.ADMIN) {
      throw new ForbiddenException("You don't have permission to delete this post");
    }

    if (post.images.length) {
      await this.deleteImages(post.images);
    }

    if (post.cloudFolder) {
      try {
        await this.cloudinaryService.deleteFolder(post.cloudFolder);
      } catch (error) {
        console.log(`Folder ${post.cloudFolder} not found in Cloudinary, continuing with deletion`);
      }
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.commentLike.deleteMany({
        where: {
          comment: {
            postId,
          },
        },
      });

      await prisma.comment.deleteMany({
        where: { postId },
      });

      await prisma.postImage.deleteMany({
        where: { postId },
      });

      await prisma.post.delete({
        where: { postId },
      });
    });

    return {
      message: `Post with ID ${postId} has been deleted successfully.`,
    };
  }

  async getPostSummery(postId: string): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { postId },
      select: {
        postId: true,
        title: true,
        content: true,
        cloudFolder: true,
        createdAt: true,
        rating: true,
        comments: {
          select: { commentId: true },
        },
        user: {
          select: {
            userId: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    return {
      postId: post.postId,
      title: post.title,
      content: post.content,
      cloudFolder: post.cloudFolder,
      user: {
        id: post.user.userId,
        name: post.user.name,
        profileImage: post.user.profileImage,
      },
      rate: post.rating ?? 0,
      comments_count: post.comments.length,
      createdAt: post.createdAt,
    };
  }
}
