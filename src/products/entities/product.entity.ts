import { ProductImage } from './productImage.entity';
import { User } from '../../users/entities/user.entity';
import { CategoryPreview } from '../../categories/entities/category.entity';

export class Product {
  productId: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currencyCode: string;
  active: boolean;
  rating?: number | null;
  reviewCount: number;
  owner?: Pick<User, 'userId' | 'name' | 'email' | 'role'>;
  approvedBy?: Pick<User, 'userId' | 'name' | 'email' | 'role'>;
  category?: CategoryPreview;
  approvedAt?: Date | null;
  images?: ProductImage[];
  cloudFolder?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
