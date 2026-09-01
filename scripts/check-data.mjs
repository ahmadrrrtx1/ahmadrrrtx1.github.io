// Build gate (runs as `prebuild`): a claim without evidence, a metric not in
// projects.json schema, or a banned phrase anywhere in src/ fails the build.
// This is strategy §17 "enforce in CI via schema validation" — enforced.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { z } from "zod";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
let errors = [];

const EvSchema = z.object({
  id: z.string().regex(/^[a-z]+\.[a-z-]+$/),
  claim: z.string().min(20),
  status: z.string().min(2),
  href: z.string().url().startsWith("https://"),
});
const MetricSchema = z.object({ label: z.string(), value: z.string() });
const ProjectSchema = z.object({
  slug: z.string(), num: z.string(), name: z.string(), oneLine: z.string().min(15),
  stack: z.array(z.string()).min(1), kind: z.string(),
  repo: z.string().url().startsWith("https://"),
  demo: z.string().url().optional(), npm: z.string().optional(),
  evidenceIds: z.array(z.string()).min(1),
  metrics: z.array(MetricSchema).optional(),
});
const LabSchema = z.object({ name: z.string(), year: z.string(), status: z.string(), repo: z.string().url(), demo: z.string().url().optional(), blurb: z.string().min(30) });

const evidence = read("src/data/evidence.json").entries.map((e, i) => EvSchema.safeParse(e)).map((r, i) => ({ r, raw: null }));
const ev = read("src/data/evidence.json").entries;
ev.forEach((e, i) => { const p = EvSchema.safeParse(e); if (!p.success) errors.push(`evidence[${e.id}]: ${p.error.issues[0].message}`); });
const ids = new Set(ev.map((e) => e.id));
if (ids.size !== ev.length) errors.push("evidence ids must be unique");

const proj = read("src/data/projects.json");
for (const p of [...proj.featured, ...proj.supporting]) {
  const s = ProjectSchema.safeParse(p);
  if (!s.success) errors.push(`project ${p.slug}: ${s.error.issues[0].message}`);
  if (p.evidenceIds?.some((id) => !ids.has(id))) errors.push(`project ${p.slug}: references unknown evidence id`);
}

for (const l of read("src/data/lab.json").entries) {
  const s = LabSchema.safeParse(l);
  if (!s.success) errors.push(`lab ${l.name}: ${s.error.issues[0].message}`);
}

// banned phrases — STYLE list from strategy §17 (checked in pages, excluding allowlisted quotes)
const BANNED = [/\bpassionate\b/i, /\bleveraging\b/i, /\bseamless(ly)?\b/i, /welcome to my portfolio/i, /turning ideas into reality/i, /🚀/, /\binnovative solutions\b/i];
function walk(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = `${dir}/${f}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(astro|md|json|js)$/.test(p)) acc.push(p);
  }
  return acc;
}
for (const f of walk("src")) {
  const txt = readFileSync(f, "utf8");
  for (const re of BANNED) {
    const m = txt.match(re);
    if (m) errors.push(`banned phrase ${re} in ${f} (found "${m[0]}")`);
  }
}

if (errors.length) {
  console.error("✘ check-data failed:\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`✔ check-data: ${ev.length} evidence entries, ${proj.featured.length + proj.supporting.length} projects, ${read("src/data/lab.json").entries.length} lab entries, copy clean`);
