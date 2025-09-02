import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryModule } from '../common/modules/cloudinary/cloudinary.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
})
export class CategoriesModule {}
