import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import { PostImage } from './post-image.entity';

export class Post {
  postId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  cloudFolder?: string | null;
  rating?: number | null;

  user: PostUserPreview;

  images: PostImage[];

  products: PostProductPreview[];

  comments?: PostCommentPreview[];
  comments_count?: number;
}

export type PostUserPreview = Pick<User, 'userId' | 'name' | 'email' | 'role' | 'isOnline' | 'profileImage'>;

export type PostProductPreview = Pick<Product, 'productId' | 'name' | 'description' | 'price'> & {
  owner: Pick<User, 'userId' | 'name' | 'email' | 'role'>;
};

export type PostCommentPreview = {
  commentId: string;
};
