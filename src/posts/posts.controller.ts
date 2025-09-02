import { Controller, Post, Body, Get, Param, Delete, HttpStatus, UseGuards, UseInterceptors, UploadedFiles, Req, Put, Patch, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SaveItemsService } from '../save-items/save-items.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private saveItemsService: SaveItemsService
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Post created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please login to create a post' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Req()
    req: AuthenticatedRequest,
    @Body() createPostDto: CreatePostDto
  ) {
    return this.postsService.create(req.user.userId, createPostDto, files);
  }

  @Get()
  @ApiResponse({ status: HttpStatus.OK, description: 'Posts found successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Posts not found' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.postsService.findAll(paginationDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiResponse({ status: HttpStatus.OK, description: 'Post updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please login to update a post' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  update(
    @UploadedFiles() files: Express.Multer.File[],
    @Req()
    req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto
  ) {
    return this.postsService.update(id, req.user.userId, updatePostDto, files);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiResponse({ status: HttpStatus.OK, description: 'Post deleted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please login to delete a post' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  remove(
    @Req()
    req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.postsService.remove(id, req.user.userId, req.user.role);
  }

  @Get(':id/summary')
  async getPost(@Param('id') id: string) {
    return this.postsService.getPostSummery(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/save')
  savePost(
    @Req()
    req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.saveItemsService.save('post', id, req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/save')
  unsavePost(
    @Req()
    req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.saveItemsService.unsave('post', id, req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Get('saved')
  getSavedPosts(
    @Req()
    req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto
  ) {
    return this.saveItemsService.getSaved('post', req.user.userId, paginationDto);
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, description: 'Post found successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }
}
