export interface Story {
  id: string;
  videoUrl: string;
  createdAt: string;
}
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
}

export interface LikeResponse {
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
}
