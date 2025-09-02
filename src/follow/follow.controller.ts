import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, Request } from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { FollowUserDto } from './dto/followUser.dto';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  @UseGuards(AuthGuard)
  async followUser(@Req() req: AuthenticatedRequest, @Body() followUserDto: FollowUserDto) {
    return this.followService.followUser(req.user.userId, followUserDto.followingId);
  }

  @Get('followers/:userId')
  @UseGuards(AuthGuard)
  async getFollowers(@Param('userId') userId: string, @Req() req: AuthenticatedRequest) {
    return this.followService.getFollowList(userId, 'followers');
  }

  @Get('followers')
  @UseGuards(AuthGuard)
  async getFollowersSelf(@Req() req: AuthenticatedRequest) {
    return this.followService.getFollowList(req.user.userId, 'followers');
  }

  @Get('following/:userId')
  @UseGuards(AuthGuard)
  async getFollowing(@Param('userId') userId: string, @Req() req: AuthenticatedRequest) {
    return this.followService.getFollowList(userId, 'following');
  }

  @Get('following')
  @UseGuards(AuthGuard)
  async getFollowingSelf(@Req() req: AuthenticatedRequest) {
    return this.followService.getFollowList(req.user.userId, 'following');
  }
}
