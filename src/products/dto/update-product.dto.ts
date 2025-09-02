import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ type: [String], description: 'Array of image IDs to delete' })
  @IsOptional()
  @IsString({ each: true })
  imagesToDelete?: string[];
}
