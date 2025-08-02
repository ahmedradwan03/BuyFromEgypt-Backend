import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsModule } from './products/products.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { CommentLikesModule } from './comment-likes/comment-likes.module';
import { CategoriesModule } from './categories/categories.module';
import { FollowModule } from './follow/follow.module';
import { ValidationModule } from './common/validation/validation.module';
import { ChatModule } from './chat/chat.module';
import { SearchModule } from './search/search.module';
import { SocialMediaModule } from './social-media/social-media.module';
import { RatingModule } from './rating/rating.module';
import { SaveItemsModule } from './save-items/save-items.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { UserPreferenceModule } from './user-preference/user-preference.module';
import { EgyptianEconomicContextModule } from './egyptian-economic-context/egyptian-economic-context.module';
import { SyncModule } from './sync/sync.module';
import { ExportModule } from './export/export.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    ProductsModule,
    PostsModule,
    CommentLikesModule,
    CommentsModule,
    CategoriesModule,
    FollowModule,
    ValidationModule,
    ChatModule,
    SearchModule,
    SocialMediaModule,
    RatingModule,
    SaveItemsModule,
    ChatbotModule,
    RecommendationModule,
    UserPreferenceModule,
    EgyptianEconomicContextModule,
    SyncModule,
    ExportModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
