export type StoryMediaType = 'video' | 'image' | 'text';
export type ImageAspectRatio = '1:1' | '9:16' | 'horizontal';

export interface Story {
  id: string;
  mediaType: StoryMediaType;
  mediaUrl?: string;
  textContent?: string;
  imageAspectRatio?: ImageAspectRatio;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  ipAddress?: string;
}

export interface LikeResponse {
  count: number;
}
