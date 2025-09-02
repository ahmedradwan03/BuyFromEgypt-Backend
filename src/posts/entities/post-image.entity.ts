export class PostImage {
  id: string;
  url: string;
  postId: string;
}

export type UploadedImageInfo = Pick<PostImage, 'id' | 'url'>;
