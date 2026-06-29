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
        context: "server",
        access: "secret",
        optional: true,
      }),
      VERCEL_DEPLOY_HOOK_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true, // inyectado por Infisical en producción
      }),
      YT_API_KEY: envField.string({
        required: true,
        context: "server",
        access: "secret",
      }),
      BEARER_TOKEN: envField.string({ context: "server", access: "secret" }),
      PUBLIC_STORIES_API_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      PUBLIC_STORIES_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),

      // ACCESS_TOKEN: envField.string({ context: "server", access: "secret" }),
      // ACCESS_TOKEN_SECRET: envField.string({ context: "server", access: "secret" }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@src": "/src",
        "@shared": "/src/shared",
        "@features": "/src/features",
        "@core": "/src/core",
      },
    },
  },

  site: "https://links.sofidev.blog",
  adapter: vercel(),
  output: "server",
  // CSRF desactivado globalmente: Astro 4+ lo activa por defecto en output:server
  // y no permite excluir rutas individuales. La seguridad del webhook externo
  // (YouTube PubSubHubbub) se garantiza mediante validación HMAC-SHA1 con YT_SECRET.
  security: { checkOrigin: false },
  integrations: [mdx(), , react()],
});
