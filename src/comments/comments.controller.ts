import { Controller, Post, Body, Get, Param, Delete, Patch, HttpStatus, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiBody, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { Comment } from './entities/comment.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comment created successfully',
    type: Comment,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(@Req() req: AuthenticatedRequest, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(req.user.userId, createCommentDto);
  }

  @Get(':commentId')
  @ApiParam({ name: 'commentId', description: 'ID of the comment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get comment by ID',
    type: Comment,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Comment not found' })
  async findById(@Param('commentId') commentId: string) {
    return this.commentsService.findById(commentId);
  }

  @Get('allComments/:postId')
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get all comments for a post',
    type: [Comment],
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
  async getAll(@Param('postId') postId: string) {
    return this.commentsService.getAll(postId);
  }

  @Patch(':commentId')
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'commentId', description: 'ID of the comment' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comment updated successfully',
    type: Comment,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Comment not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not your comment' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async update(
    @Req()
    req: AuthenticatedRequest,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto
  ) {
    return this.commentsService.update(commentId, req.user.userId, updateCommentDto);
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'commentId', description: 'ID of the comment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comment deleted successfully',
    schema: {
      example: { message: 'Comment deleted successfully' },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Comment not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not your comment' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async remove(
    @Req()
    req: AuthenticatedRequest,
    @Param('commentId') commentId: string
  ) {
    return this.commentsService.delete(commentId, req.user.userId, req.user.role);
  }
}
