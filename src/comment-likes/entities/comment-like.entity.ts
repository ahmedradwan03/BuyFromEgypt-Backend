export class CommentLike {
  user: UserPreview;
  comment?: any;
}

// export type UserPreview = Pick<User, 'userId' | 'name' | 'profileImage'> ;

export class UserPreview {
  userId: string;
  name: string;
  profileImage: string | null;
}
