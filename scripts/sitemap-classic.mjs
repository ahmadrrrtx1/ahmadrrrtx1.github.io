// Astro emits sitemap-index.xml → sitemap-0.xml (index + child).
// GSC and every third-party crawler conventionally expects /sitemap.xml
// as a single self-contained <urlset> — one fetch, no index hop, one
// less failure mode. We copy the generated child to the classic name;
// the index and child stay published too (submit whichever you like).
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("../dist/sitemap-0.xml", import.meta.url);
const dst = new URL("../dist/sitemap.xml", import.meta.url);
const xml = readFileSync(src, "utf8");
if (!xml.startsWith("<?xml") || !xml.includes("</urlset>")) {
  console.error("sitemap-classic: sitemap-0.xml looks malformed — aborting");
  process.exit(1);
}
const urls = (xml.match(/<loc>/g) || []).length;
if (urls < 10) {
  console.error(`sitemap-classic: only ${urls} urls found — refusing to publish`);
  process.exit(1);
}
writeFileSync(dst, xml);
console.log(`sitemap-classic: /sitemap.xml written with ${urls} urls (classic name, no index hop)`);
