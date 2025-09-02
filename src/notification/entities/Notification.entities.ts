import { User } from '../../users/entities/user.entity';

export class Notification {
  id: string;
  message: string;
  postId: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: Date;
  sender: Pick<User, 'name' | 'profileImage'>;
}
