import type { APIRoute } from "astro";
import { isAuthenticated } from "@src/shared/utils/auth";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const authenticated = await isAuthenticated(cookies);
    return new Response(
      JSON.stringify({ authenticated }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ authenticated: false, error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
