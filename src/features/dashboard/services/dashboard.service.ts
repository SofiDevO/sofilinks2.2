import type { ApiResponse } from "@features/stories/types/stories.types";
import type { Ban } from "../types/dashboard.types";
import {
  apiFetch,
  getAdminHeaders,
} from "@src/shared/helpers/stories.helpers";

export const dashboardService = {
  getUploadUrl: async (
    token: string,
  ): Promise<ApiResponse<{ uploadUrl: string; storyId: string }>> => {
    return apiFetch("/api/v1/stories", {
      method: "POST",
      headers: getAdminHeaders(token),
    });
  },

  deleteStory: async (
    storyId: string,
    token: string,
  ): Promise<ApiResponse<null>> => {
    return apiFetch(`/api/v1/stories/${storyId}`, {
      method: "DELETE",
      headers: getAdminHeaders(token),
    });
  },

  getBans: async (token: string): Promise<ApiResponse<Ban[]>> => {
    return apiFetch("/api/v1/admin/bans", {
      method: "GET",
      headers: getAdminHeaders(token),
    });
  },
  banIp: async (
    ipAddress: string,
    reason: string,
    token: string,
  ): Promise<ApiResponse<null>> => {
    return apiFetch(`/api/v1/admin/bans`, {
      method: "POST",
      headers: getAdminHeaders(token),
      body: JSON.stringify({ ipAddress, reason }),
    });
  },
  unbanIp: async (
    ipAddress: string,
    token: string,
  ): Promise<ApiResponse<null>> => {
    return apiFetch(`/api/v1/admin/bans/${ipAddress}`, {
      method: "DELETE",
      headers: getAdminHeaders(token),
    });
  },
};
