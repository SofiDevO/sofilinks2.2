import type {
  Story,
  Comment,
  LikeResponse,
} from "../types/stories.types";
import type { ApiResponse } from "@shared/types/api.types";
import { apiFetch, getPublicHeaders } from "@shared/helpers/stories.helpers";

export const storiesService = {
  getActiveStories: async (): Promise<ApiResponse<Story[]>> => {
    return apiFetch(`/api/v1/stories`, {
      method: "GET",
      headers: getPublicHeaders(),
    });
  },
  getLikesCount: async (
    storyId: string,
  ): Promise<ApiResponse<LikeResponse>> => {
    return apiFetch(`/api/v1/stories/${storyId}/likes`, {
      method: "GET",
      headers: getPublicHeaders(),
    });
  },
  addLike: async (storyId: string): Promise<ApiResponse<LikeResponse>> => {
    return apiFetch(`/api/v1/stories/${storyId}/likes`, {
      method: "POST",
      headers: getPublicHeaders(),
    });
  },

  getComments: async (storyId: string): Promise<ApiResponse<Comment[]>> => {
    return apiFetch(`/api/v1/stories/${storyId}/comments`, {
      method: "GET",
      headers: getPublicHeaders(),
    });
  },
  addComment: async (
    storyId: string,
    content: string,
  ): Promise<ApiResponse<Comment[]>> => {
    return apiFetch(`/api/v1/stories/${storyId}/comments`, {
      method: "POST",
      headers: getPublicHeaders(),
      body: JSON.stringify({ content }),
    });
  },
};
