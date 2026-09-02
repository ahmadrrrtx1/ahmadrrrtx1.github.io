// Publish /sitemap.xml — the classic path every crawler assumes — as a
// hand-written minimal <urlset>: one <loc> + build-day <lastmod> per page,
// no extension namespaces at all. Astro's generated sitemap-index/child
// remain available; this is the maximally-vanilla GSC target.
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("../dist/sitemap-0.xml", import.meta.url);
const dst = new URL("../dist/sitemap.xml", import.meta.url);
const xml = readFileSync(src, "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length < 10 || !urls.every((u) => u.startsWith("https://ahmadrrrtx1.github.io/"))) {
  console.error(`sitemap-classic: refusing to publish (${urls.length} urls, host check failed)`);
  process.exit(1);
}
const lastmod = new Date().toISOString().slice(0, 10);
const body = urls
  .map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
  .join("\n");
const out = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
writeFileSync(dst, out);
console.log(`sitemap-classic: hand-written /sitemap.xml — ${urls.length} urls, lastmod ${lastmod}, plain LF, zero extension namespaces`);
