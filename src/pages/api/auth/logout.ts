import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete("stories_token", { path: "/" });
  return redirect("/login");
};
