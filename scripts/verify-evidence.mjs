// The site's immune system (strategy §6.1 / P8): re-checks every evidence link,
// every demo, every credential URL. Nightly in CI. Failures render as honest ⚠
// rows on the site — the verifier never hides rot, and never fails the build
// loudly enough to nuke a deploy (soft-fail by design).
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";

const BOT_BLOCKED = new Set([401, 403, 429, 451, 999]); // real pages that block curl-style clients → warn, not fail
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function collectUrls() {
  const urls = new Set();
  const read = (p) => JSON.parse(readFileSync(p, "utf8"));
  const dataDir = "src/data";
  const evidence = read(`${dataDir}/evidence.json`).entries.map((e) => e.href);
  evidence.forEach((u) => urls.add(u));
  const projects = read(`${dataDir}/projects.json`);
  for (const p of [...projects.featured, ...projects.supporting]) {
    if (p.repo) urls.add(p.repo);
    if (p.demo) urls.add(p.demo);
  }
  read(`${dataDir}/lab.json`).entries.forEach((p) => { if (p.repo) urls.add(p.repo); if (p.demo) urls.add(p.demo); });
  read(`${dataDir}/writing.json`).articles.forEach((a) => urls.add(a.url));
  read(`${dataDir}/credentials.json`).verified.forEach((c) => urls.add(c.url));
  return [...urls];
}

async function check(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "*/*" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const ms = Date.now() - t0;
    if (r.ok) return { url, code: r.status, status: "pass", ms };
    if (BOT_BLOCKED.has(r.status)) return { url, code: r.status, status: "warn", ms, note: "issuer blocks automated checks; likely fine in a browser" };
    if (r.status === 404) return { url, code: 404, status: "fail", ms, note: "link rot — remove or repair" };
    if (r.status >= 500) return { url, code: r.status, status: "fail", ms, note: "origin error (e.g., deployment cold/offline)" };
    return { url, code: r.status, status: "warn", ms };
  } catch (e) {
    return { url, code: 0, status: "fail", ms: Date.now() - t0, note: e.name === "TimeoutError" ? "timeout" : "unreachable" };
  }
}

const urls = collectUrls();
const results = [];
for (const u of urls) { results.push(await check(u)); await new Promise((r) => setTimeout(r, 350)); }
const pass = results.filter((r) => r.status === "pass").length;
const warn = results.filter((r) => r.status === "warn").length;
const fail = results.filter((r) => r.status === "fail").length;
const report = { verifiedAt: new Date().toISOString(), total: results.length, pass, warn, fail, results };
mkdirSync("public/data", { recursive: true });
for (const p of ["src/data/evidence-report.json", "public/data/evidence-report.json"]) writeFileSync(p, JSON.stringify(report, null, 2));
console.log(`evidence: ${pass}/${results.length} pass · ${warn} warn · ${fail} fail`);
for (const r of results.filter((x) => x.status !== "pass")) console.log(`  [${r.status.toUpperCase()} ${r.code}] ${r.url}${r.note ? " — " + r.note : ""}`);
process.exit(0); // soft-fail: the build ships, the site tells the truth about what's broken
