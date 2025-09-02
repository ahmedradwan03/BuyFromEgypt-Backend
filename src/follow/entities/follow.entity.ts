import { User } from '../../users/entities/user.entity';

export class Follow {
  id: string;
  follower?: UserPreview;
  following?: UserPreview;
  createdAt: Date;
}

export type UserPreview = Pick<User, 'userId' | 'name' | 'profileImage'>;
