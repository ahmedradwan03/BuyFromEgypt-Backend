import { Controller, Get, Query, Delete, UseGuards, Req } from '@nestjs/common';
import { SearchService } from './search.service';
import { GetSearchHistoryDto } from './dto/search-history.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';
import { SearchType } from './entities/search.entity';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 200, description: 'Return search results' })
  @ApiQuery({ name: 'keyword', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: true, enum: ['users', 'products', 'messages'], description: 'Type of search' })
  async globalSearch(@Query('keyword') keyword: string, @Query('type') type: string, @Req() req: AuthenticatedRequest) {
    return this.searchService.globalSearch(keyword, type as SearchType, req.user.userId);
  }

  @Get('history')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 200, description: 'Return search history' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by search type' })
  async getSearchHistory(@Query() filters: GetSearchHistoryDto, @Req() req: AuthenticatedRequest) {
    return this.searchService.getSearchHistory(req.user.userId, filters);
  }

  @Delete('history')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 200, description: 'Search history cleared successfully' })
  async clearSearchHistory(@Req() req: AuthenticatedRequest) {
    return this.searchService.clearSearchHistory(req.user.userId);
  }
}
