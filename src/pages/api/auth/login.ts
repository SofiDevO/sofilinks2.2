import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing username or password",
        }),
        { status: 400 },
      );
    }

    const API_URL =
      import.meta.env.PUBLIC_STORIES_API_URL || "http://localhost:3000";
    const API_KEY = import.meta.env.PUBLIC_STORIES_API_KEY;
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({ username, password }),
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `API unreachable or misconfigured (status: ${response.status}). Check PUBLIC_STORIES_API_URL.`,
        }),
        { status: 502 },
      );
    }
    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        { status: 401 },
      );
    }

    cookies.set("stories_token", data.token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 3,
    });
    return new Response(
      JSON.stringify({
        success: true,
      }),
      { status: 200 },
    );
  } catch (error: any) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500 },
    );
  }
};
