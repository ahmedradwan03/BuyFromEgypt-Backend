import { Body, Controller, Param, Post, Req, UseGuards, Get, Query } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';
import { RateableEntity } from './entities/rating.entity';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(AuthGuard)
  @Post(':entityType/:entityId')
  async rateEntity(
    @Param('entityType') entityType: RateableEntity,
    @Param('entityId') entityId: string,
    @Body() createRatingDto: CreateRatingDto,
    @Req()
    req: AuthenticatedRequest
  ) {
    return this.ratingService.rate(entityType, {
      userId: req.user.userId,
      entityId,
      value: createRatingDto.value,
      comment: createRatingDto.comment || '',
    });
  }

  @UseGuards(AuthGuard)
  @Get(':entityType/:entityId')
  @ApiBearerAuth()
  @ApiParam({ name: 'entityType', enum: ['post', 'product'], description: 'Type of the entity to rate' })
  @ApiParam({ name: 'entityId', description: 'ID of the entity to rate' })
  @ApiResponse({
    status: 200,
    description: 'Returns average rating, total reviews, and user rating',
    schema: { example: { averageRating: 3, totalReviews: 2, userRating: 4 } },
  })
  @ApiResponse({ status: 400, description: 'Invalid entity type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEntityRating(@Param('entityType') entityType: RateableEntity, @Param('entityId') entityId: string, @Req() req: AuthenticatedRequest) {
    return this.ratingService.getEntityRating(entityType, entityId, req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Get(':entityType/:entityId/all')
  @ApiBearerAuth()
  @ApiParam({ name: 'entityType', enum: ['post', 'product'], description: 'Type of the entity to rate' })
  @ApiParam({ name: 'entityId', description: 'ID of the entity to rate' })
  @ApiResponse({
    status: 200,
    description: 'Returns all ratings for the entity',
  })
  @ApiResponse({ status: 400, description: 'Invalid entity type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllRatings(@Param('entityType') entityType: RateableEntity, @Param('entityId') entityId: string) {
    return this.ratingService.getAllRatings(entityType, entityId);
  }
}
