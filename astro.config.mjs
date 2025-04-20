import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

import mdx from "@astrojs/mdx";

import preact from "@astrojs/preact";

import react from "@astrojs/react";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  site: "https://link.itssofi.dev",
  adapter: vercel(),
  output: "server",
  integrations: [mdx(), preact(), react()],

});