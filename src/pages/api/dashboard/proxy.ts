import type { APIRoute } from "astro";

const API_URL =
  import.meta.env.PUBLIC_STORIES_API_URL || "http://localhost:8787";
const API_KEY = import.meta.env.PUBLIC_STORIES_API_KEY;
const TOKEN_NAME = "stories_token";

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { path, method, body: requestBody } = body;

    if (!path || !method) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: path, method",
        }),
        { status: 400 },
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      "Authorization": `Bearer ${token}`,
    };

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
    };

    if (requestBody && method.toUpperCase() !== "GET") {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    const response = await fetch(`${API_URL}${path}`, fetchOptions);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Backend unreachable or misconfigured (status: ${response.status})`,
        }),
        { status: 502 },
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: response.status });
  } catch (error: any) {
    console.error("[Dashboard Proxy]", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 },
    );
  }
};
