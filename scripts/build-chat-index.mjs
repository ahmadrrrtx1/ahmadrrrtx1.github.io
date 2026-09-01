// ─── build-chat-index.mjs ───────────────────────────────────────────────────
// The "R" in the assistant's pipeline. Runs post-build: scans the built HTML,
// splits every page into heading-scoped chunks, and writes a plain JSON index.
// The client side is a deterministic TF-IDF retriever — the assistant QUOTES
// the site and links back to the exact page+section. No LLM, no invented answers.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function walk(dir, rel = "") {
  const out = [];
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const r = rel ? rel + "/" + e.name : e.name;
    if (e.isDirectory()) out.push(...walk(dir, r));
    else if (e.name === "index.html" && !r.startsWith("404")) out.push(join(dir, r));
  }
  return out;
}
const strip = (s) => s
  .replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ").trim();

const chunks = [];
for (const file of walk(dist)) {
  const url = "/" + file.slice(dist.length + 1).replace(/index\.html$/, "");
  const html = readFileSync(file, "utf8");
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || html.match(/<body[^>]*>[\s\S]*?<\/body>/i) || [""])[0];
  // page title: first h1
  const pageTitle = strip((main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || ["", ""])[1]) || url;
  // split at headings h1–h3; carry a section title + anchor (nearest ancestor with id)
  const pieces = [...main.matchAll(/<(h[123])[^>]*>([\s\S]*?)<\/\1>/gi)];
  const bounds = [];
  const sectionTitleOf = (pos) => {
    let cur = { t: pageTitle, a: "" };
    for (const m of pieces) if (m.index <= pos) cur = { t: strip(m[2]) || cur.t, a: "" };
    // find nearest preceding section/article id (panel anchors like id="whoami")
    const before = main.slice(0, pos);
    const ids = [...before.matchAll(/<(?:section|article)[^>]*id="([^"]+)"/gi)];
    if (ids.length) cur.a = "#" + ids[ids.length - 1][1];
    return cur;
  };
  const points = [0, ...pieces.map((m) => m.index), main.length];
  for (let i = 0; i < points.length - 1; i++) {
    const raw = main.slice(points[i], points[i + 1]);
    const { t, a } = sectionTitleOf(points[i]);
    const text = strip(raw);
    if (text.length < 50) continue;
    // sentence-group chunks ≈ 180 chars
    const sents = text.split(/(?<=[.!?…])\s+(?=[A-Z0-9“>"'\[])|\s+·\s+(?=[A-Z])/);
    let buf = "";
    for (const s of sents) {
      buf = buf ? buf + " " + s : s;
      if (buf.length >= 180) { if (buf.length >= 60) chunks.push({ p: pageTitle, s: t, u: url + a, x: buf.slice(0, 400) }); buf = ""; }
    }
    if (buf.length >= 60) chunks.push({ p: pageTitle, s: t, u: url + a, x: buf.slice(0, 400) });
  }
}
// dedupe identical chunk texts (nav noise), cap size
const seen = new Set();
const final = chunks.filter((c) => { const k = c.x.slice(0, 80); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 600);

const json = JSON.stringify({ gen: new Date().toISOString(), n: final.length, chunks: final });
for (const dir of [join(root, "public/data"), join(dist, "data")]) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "chat-index.json"), json);
}
console.log(`✔ chat-index: ${final.length} chunks across ${new Set(final.map((c) => c.p)).size} pages · ${(json.length / 1024) | 0} KB`);
