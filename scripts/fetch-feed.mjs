// Build-time data feed: pulls REAL numbers from GitHub + npm at deploy so the
// site never hand-maintains stats that rot. Output is checked into src/data AND
// copied to public/data (islands fetch it lazily). Written 2026-09-01.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const REPOS = ["xr", "xr-foundation-model", "Gemma-4-RSS-Intelligence-Monitor", "CivicShield-ai", "commit-canvas", "TruthCI", "AegisRoute", "NovaWeather", "brainrot-iq"];
const H = { "User-Agent": "ahmad-console-feed", Accept: "application/vnd.github+json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let quotaExhausted = false;
async function gh(path) {
  if (quotaExhausted) return null;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`https://api.github.com${path}`, { headers: H });
    if (r.status === 403 || r.status === 429) {
      if ((r.headers.get("x-ratelimit-remaining") ?? "1") === "0") { quotaExhausted = true; return null; }
      await sleep(4000); continue;
    }
    if (!r.ok) return null;
    return r.json();
  }
  return null;
}

// Merge strategy: a partial/degraded fetch NEVER clobbers good checked-in data.
let out = { fetchedAt: new Date().toISOString(), repos: {}, recentCommits: [], xrCi: null, npm: null };
const prev = existsSync("src/data/github-snapshot.json") ? JSON.parse(readFileSync("src/data/github-snapshot.json", "utf8")) : null;
if (prev) { out.repos = prev.repos ?? {}; out._prevCommits = prev.recentCommits ?? []; out.xrCi = prev.xrCi ?? null; out.npm = prev.npm ?? null; }
out.recentCommits = [];

for (const name of REPOS) {
  const meta = await gh(`/repos/ahmadrrrtx/${name}`);
  if (!meta) continue;
  out.repos[name] = { stars: meta.stargazers_count, pushedAt: meta.pushed_at, description: meta.description, license: meta.license?.spdx_id ?? null, archived: meta.archived };
  const commits = await gh(`/repos/ahmadrrrtx/${name}/commits?per_page=3`);
  for (const c of commits?.commit ? [commits] : (commits ?? []).slice(0, 2)) {
    out.recentCommits.push({
      repo: name,
      sha: c.sha.slice(0, 7),
      msg: c.commit.message.split("\n")[0].slice(0, 90),
      date: c.commit.author.date,
      url: `https://github.com/ahmadrrrtx/${name}/commit/${c.sha}`,
    });
  }
  await sleep(250);
}
out.recentCommits.sort((a, b) => (a.date < b.date ? 1 : -1));
out.recentCommits = out.recentCommits.slice(0, 6);

const runs = await gh("/repos/ahmadrrrtx/xr/actions/runs?per_page=1");
if (runs?.workflow_runs?.[0]) {
  const w = runs.workflow_runs[0];
  out.xrCi = { name: w.name, status: w.status, conclusion: w.conclusion, url: w.html_url, at: w.updated_at };
}

try {
  const npm = await (await fetch("https://registry.npmjs.org/@rrrtx%2Fxr", { headers: H })).json();
  if (npm?.["dist-tags"]?.latest) out.npm = { pkg: "@rrrtx/xr", latest: npm["dist-tags"].latest, url: "https://www.npmjs.com/package/@rrrtx/xr" };
} catch { /* offline build tolerated: snapshot keeps last checked-in values */ }

if (quotaExhausted || out.recentCommits.length === 0) out.recentCommits = out._prevCommits;
delete out._prevCommits;
const json = JSON.stringify(out, null, 2);
mkdirSync("src/data", { recursive: true });
mkdirSync("public/data", { recursive: true });
writeFileSync("src/data/github-snapshot.json", json);
writeFileSync("public/data/github-snapshot.json", json);
console.log(`feed ok — ${Object.keys(out.repos).length} repos, ${out.recentCommits.length} commits, CI: ${out.xrCi?.conclusion ?? "n/a"}, npm: ${out.npm?.latest ?? "n/a"}`);
