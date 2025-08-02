import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SaveItemsService } from './save-items.service';
import { FilterProductsDto } from '../common/dto/filter-products.dto';

@Controller('save-items')
export class SaveItemsController {
  constructor(private readonly saveItemsService: SaveItemsService) {}

  @Get(':entityType/:userId')
  async getSavedItems(@Param('entityType') entityType: string, @Param('userId') userId: string, @Query() filterDto: FilterProductsDto) {
    return this.saveItemsService.getSaved(entityType as any, userId, filterDto);
  }
}
