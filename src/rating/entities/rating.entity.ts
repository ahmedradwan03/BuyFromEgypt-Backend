import { User } from '../../users/entities/user.entity';

export const RATEABLE_ENTITIES = ['post', 'product'] as const;

export type RateableEntity = (typeof RATEABLE_ENTITIES)[number];

export interface RatingInput {
  userId: string;
  entityId: string;
  value: number;
  comment: string;
}

export class Rate {
  averageRating: number;
  totalReviews: number;
  userRating: number | null;
  comment: string | null;
  createdAt?: Date | null;
  user?: (Pick<User, 'name'> & { profileImage: string | null }) | null;
}
