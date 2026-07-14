/**
 * Server-side fetch helper for dashboard pages.
 * Reads the JWT from cookies and calls the Stories Manager backend
 * with proper dual-header authentication (X-API-Key + Authorization Bearer).
 */
import type { AstroCookies } from "astro";

const API_URL =
  import.meta.env.PUBLIC_STORIES_API_URL || "http://localhost:8787";
const API_KEY = import.meta.env.PUBLIC_STORIES_API_KEY;
const TOKEN_NAME = "stories_token";

export async function serverFetch<T>(
  cookies: AstroCookies,
  path: string,
  method: string = "GET",
  body?: object,
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    return { success: false, error: "No authentication token" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    "Authorization": `Bearer ${token}`,
  };

  const options: RequestInit = { method, headers };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Request failed" };
    }

    return data;
  } catch (error: any) {
    console.error("[serverFetch]", error);
    return { success: false, error: "Failed to connect to backend" };
  }
}
