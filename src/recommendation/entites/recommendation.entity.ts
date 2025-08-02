import { Product } from '../../products/entities/product.entity';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';
import { PostImage } from '../../posts/entities/post-image.entity';
import { ProductImage } from '../../products/entities/productImage.entity';
import { Category } from '../../categories/entities/category.entity';

export class Recommendation {
  status: 'success';
  message: string;
  data: {
    recommendations: RecommendedPost[] | RecommendedProduct[];
    user_id: string;
    recommendation_type: 'product' | 'post';
    generated_at: string;
  };
}

type RecommendedPost = Pick<Post, 'postId' | 'title' | 'content'> & {
  user: Pick<User, 'userId' | 'name'>;
  products: Product[];
  images: PostImage[];
};

type RecommendedProduct = Pick<Product, 'productId' | 'name' | 'slug' | 'price' | 'currencyCode' | 'rating'> & {
  images: Pick<ProductImage, 'url' | 'isPrimary'>[];
  owner: Pick<User, 'userId' | 'name'>;
  category: Pick<Category, 'name'>;
};
