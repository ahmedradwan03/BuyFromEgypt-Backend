import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SocialMediaService } from './social-media.service';
import { CreateSocialMediaDto } from './dto/create-social-media.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';

@ApiTags('social-media')
@Controller('social-media')
@UseGuards(AuthGuard)
export class SocialMediaController {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Social media link created successfully' })
  create(@Request() req: AuthenticatedRequest, @Body() createSocialMediaDto: CreateSocialMediaDto) {
    return this.socialMediaService.create(req.user.userId, createSocialMediaDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Return all social media links' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.socialMediaService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Return social media link' })
  findOne(@Param('id') id: string) {
    return this.socialMediaService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Social media link updated successfully' })
  update(@Param('id') id: string, @Body() updateSocialMediaDto: UpdateSocialMediaDto) {
    return this.socialMediaService.update(id, updateSocialMediaDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Social media link deleted successfully' })
  remove(@Param('id') id: string) {
    return this.socialMediaService.remove(id);
  }

  @Delete()
  @ApiResponse({ status: 200, description: 'All social media links deleted successfully' })
  removeAll(@Request() req: AuthenticatedRequest) {
    return this.socialMediaService.removeAll(req.user.userId);
  }

  @Get('platform/:platform')
  @ApiResponse({ status: 200, description: 'Return social media link for platform' })
  findByPlatform(@Request() req: AuthenticatedRequest, @Param('platform') platform: string) {
    return this.socialMediaService.findByPlatform(req.user.userId, platform);
  }
}
