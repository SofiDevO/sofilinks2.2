export interface Story {
  id: string;
  videoUrl: string;
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

