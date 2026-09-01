import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // Canonical domain: GitHub Pages user site; override with SITE_URL if a custom domain lands.
  site: process.env.SITE_URL ?? "https://ahmadrrrtx1.github.io",
  output: "static",
  integrations: [sitemap()],
  server: { host: "0.0.0.0", port: 4321, strictPort: true, allowedHosts: true },
  
});
