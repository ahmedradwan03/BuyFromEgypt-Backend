export const SEARCH_TYPES = ['users', 'products', 'messages'] as const;

export type SearchType = (typeof SEARCH_TYPES)[number];

type UserSearchResult = {
  userId: string;
  name: string;
  profileImage: string | null;
};

type ProductSearchResult = {
  productId: string;
  name: string;
  images: { url: string }[];
};

export type GlobalSearchResult = UserSearchResult[] | ProductSearchResult[];