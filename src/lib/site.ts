// Build-time helpers: read the checked-in GitHub/npm snapshot and the
// verifier report. The site never fetches these at runtime — static truth.
import { existsSync, readFileSync } from "node:fs";
import snapshot from "../data/github-snapshot.json";
import report from "../data/evidence-report.json";
import commandsJson from "../data/commands.json";
import evidenceJson from "../data/evidence.json";

export const SNAP = snapshot as unknown as Snapshot;
export const REPORT = report as unknown as Report;
export const COMMANDS = commandsJson;
export const EVIDENCE = Object.fromEntries((evidenceJson as unknown as { entries: EvidenceEntry[] }).entries.map((e) => [e.id, e]));
export const HAS_RESUME = existsSync("public/resume.pdf");

export interface EvidenceEntry { id: string; claim: string; status: string; href: string; note?: string }
export interface RepoMeta { stars: number; pushedAt: string; description: string | null; license: string | null; archived: boolean }
export interface CommitRow { repo: string; sha: string; msg: string; date: string; url: string }
export interface Snapshot {
  fetchedAt: string;
  repos: Record<string, RepoMeta>;
  recentCommits: CommitRow[];
  xrCi: { name: string; status: string; conclusion: string | null; url: string; at: string } | null;
  npm: { pkg: string; latest: string; url: string } | null;
}
export interface VerifyResult { url: string; code: number; status: "pass" | "warn" | "fail"; ms: number; note?: string }
export interface Report { verifiedAt: string; total: number; pass: number; warn: number; fail: number; results: VerifyResult[] }

export function evidenceFor(ids: string[]): EvidenceEntry[] {
  return ids.map((id) => (EVIDENCE as Record<string, EvidenceEntry>)[id]).filter(Boolean);
}

export function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const m = Math.floor(days / 30);
  return m <= 1 ? "1mo ago" : `${m}mo ago`;
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
}

/** Derive the honest status chip for a repo from live signals, not typed text. */
export function derivedStatus(repoName: string, hasDemo: boolean, kind: string): { label: string; tone: string; glyph: string } {
  const meta = (SNAP.repos as Record<string, RepoMeta>)[repoName];
  if (!meta) return { label: kind, tone: "", glyph: "·" };
  if (meta.archived) return { label: "Archived", tone: "bad", glyph: "✘" };
  const active = daysSince(meta.pushedAt) <= 21;
  if (hasDemo && active) return { label: "Live · active", tone: "ok", glyph: "●" };
  if (hasDemo) return { label: "Live", tone: "ok", glyph: "●" };
  if (active) return { label: "Active", tone: "ok", glyph: "●" };
  if (kind === "RESEARCH") return { label: "On hold · audited", tone: "cyan", glyph: "◼" };
  return { label: "Shipped", tone: "", glyph: "✔" };
}

export function fileLabel(url: string): string {
  const m = url.match(/github\.com\/[^/]+\/([^/]+)\/(?:blob|tree)\/[^/]+\/(.+)$/);
  if (m) return `${m[1]} / ${m[2]}`;
  const repo = url.match(/github\.com\/[^/]+\/([^/]+)\/?$/);
  if (repo) return repo[1];
  try { return new URL(url).hostname.replace(/^www\./, "") + url.replace(/^https?:\/\/(www\.)?/, "/").slice(0, 34); } catch { return url; }
}

export const CONTACT = {
  email: "ahmadrrrtx@gmail.com",
  github: "https://github.com/ahmadrrrtx",
  linkedin: "https://www.linkedin.com/in/ahmadrrrtx",
  agency: "https://rrrtx-systems.com/",
  devto: "https://dev.to/ahmad_rrrtx",
};

/* public profiles — each URL checked live on 2026-09-01 (medium 403 = bot-block, profile exists) */
export const NEWSLETTER = "https://ahmadrrrtx.substack.com/";
export const PROFILES = [
  { label: "github", href: "https://github.com/ahmadrrrtx" },
  { label: "substack", href: "https://ahmadrrrtx.substack.com/", note: "newsletter" },
  { label: "medium", href: "https://medium.com/@ahmadrrrtx333" },
  { label: "hashnode", href: "https://hashnode.com/@ahmadrrrtx" },
  { label: "dev.to", href: "https://dev.to/ahmad_rrrtx" },
  { label: "indie hackers", href: "https://www.indiehackers.com/ahmad_rrrtx" },
  { label: "daily.dev", href: "https://daily.dev/ahmadrrrtx" },
];
