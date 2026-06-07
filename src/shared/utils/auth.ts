import type { AstroCookies } from "astro";

const TOKEN_NAME = "stories_token";

export function getToken(cookies: AstroCookies): string | undefined {
  return cookies.get(TOKEN_NAME)?.value;
}

export function isAuthenticated(cookies: AstroCookies): boolean {
  return cookies.has(TOKEN_NAME);
}

export function clearToken(cookies: AstroCookies): void {
  cookies.delete(TOKEN_NAME, { path: "/" });
}
