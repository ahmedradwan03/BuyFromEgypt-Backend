import { Post } from '../../posts/entities/post.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { PostImage } from '../../posts/entities/post-image.entity';
import { Category } from '../../categories/entities/category.entity';
import { ProductImage } from '../../products/entities/productImage.entity';

export const ENTITY_TYPES = ['post', 'product'] as const;
export type SaveableEntity = (typeof ENTITY_TYPES)[number];

export type RecommendedPost = Pick<Post, 'postId' | 'title' | 'content'> & {
  user: Pick<User, 'userId' | 'name' | 'email' | 'role' | 'isOnline'>;
  products: Product[];
  images: PostImage[];
};

export type RecommendedProduct = Pick<Product, 'productId' | 'name' | 'price' | 'slug'> & {
  images: { id: string; url: string; isPrimary: boolean }[];
  category: { categoryId: string; name: string };
  owner: Pick<User, 'userId' | 'name' | 'email' | 'role'>;
};

export type SavedEntity = RecommendedPost | RecommendedProduct;
