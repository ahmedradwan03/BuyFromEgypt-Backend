import { User } from '../../users/entities/user.entity';

export class Comment {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  user: Pick<User, 'userId' | 'name' | 'profileImage'>;
}
