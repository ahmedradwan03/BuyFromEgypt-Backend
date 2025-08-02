import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export class Category {
  categoryId: string;
  name: string;
  description?: string | null;
  user?: Pick<User, 'userId' | 'name' | 'email' | 'role' | 'type' | 'active'>;
  products?: Product[];
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryPreview = Pick<Category, 'categoryId' | 'name' | 'description'>;
