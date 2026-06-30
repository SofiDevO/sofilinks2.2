import type { AstroCookies } from "astro";

const TOKEN_NAME = "stories_token";
const API_URL = import.meta.env.PUBLIC_STORIES_API_URL || "http://localhost:3000";
const API_KEY = import.meta.env.PUBLIC_STORIES_API_KEY;
export function getToken(cookies: AstroCookies): string | undefined {
  return cookies.get(TOKEN_NAME)?.value;
}

export async function isAuthenticated(cookies: AstroCookies) {
  const token = getToken(cookies);
  // console.log(token);

  if (!token) {
    return false;
  }

  try {
    const verifyTokenResponse = await fetch(`${API_URL}/api/v1/auth/verify`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-API-Key": API_KEY
      }
    });

    if (!verifyTokenResponse.ok) {
      throw new Error("Invalid token");
    }
    // console.log(verifyTokenResponse.ok);

    return verifyTokenResponse.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function clearToken(cookies: AstroCookies): void {
  cookies.delete(TOKEN_NAME, { path: "/" });
}
