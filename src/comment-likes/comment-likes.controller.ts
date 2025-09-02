import { Controller, Post, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import { CommentLikesService } from './comment-likes.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';


@Controller('comment-likes')
@UseGuards(AuthGuard)
export class CommentLikesController {
  constructor(private readonly commentLikesService: CommentLikesService) {}

  @Post(':commentId/like')
  async likeComment(@Req() req: AuthenticatedRequest, @Param('commentId') commentId: string) {
    return this.commentLikesService.likeComment(req.user.userId, commentId);
  }

  @Post(':commentId/dislike')
  async dislikeComment(@Req() req: AuthenticatedRequest, @Param('commentId') commentId: string) {
    return this.commentLikesService.dislikeComment(req.user.userId, commentId);
  }

  @Delete(':commentId/reaction')
  async removeReaction(@Req() req: AuthenticatedRequest, @Param('commentId') commentId: string) {
    return this.commentLikesService.removeReaction(req.user.userId, commentId);
  }

  @Get(':commentId/reactions')
  async getCommentReactions(@Param('commentId') commentId: string) {
    return this.commentLikesService.getCommentReactions(commentId);
  }

  @Get(':commentId/likes/count')
  async getCommentLikesCount(@Param('commentId') commentId: string) {
    return this.commentLikesService.getCommentLikesCount(commentId);
  }

  @Get(':commentId/dislikes/count')
  async getCommentDislikesCount(@Param('commentId') commentId: string) {
    return this.commentLikesService.getCommentDislikesCount(commentId);
  }
}
