import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import react from "@astrojs/react";

import mdx from "@astrojs/mdx";

export default defineConfig({
  env: {
    schema: {
      WPGRAPHQL_URL: envField.string({
        required: true,
        context: "server",
        access: "secret",
      }),
      YT_SECRET: envField.string({
        required: true,
        context: "client",
        access: "public",
      }),
      BEARER_TOKEN: envField.string({ context: "server", access: "secret" }),
      SITE_URL: envField.string({ context: "server", access: "public" }),

      // ACCESS_TOKEN: envField.string({ context: "server", access: "secret" }),
      // ACCESS_TOKEN_SECRET: envField.string({ context: "server", access: "secret" }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },

  site: "https://links.sofidev.blog",
  adapter: vercel(),
  output: "server",
  integrations: [mdx(), , react()],
});
