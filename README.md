# AHMAD:// — the attestation console

Personal portfolio of Muhammad Ahmad, built per `portfolio-strategy.md` (the 20-section plan). The site
behaves like an audit tool: every claim links to evidence, every stat is fetched at build, every link is
re-checked nightly — and the site says so in its footer whether the result is good or not.

## Stack

Astro 5 (static) · Tailwind-free token CSS · hand-rolled vanilla-JS command palette + shell (~4.5 KB gz,
the only JS on the page) · GitHub Actions · no analytics until decided. Fonts self-hosted
(Martian Mono Variable / Geist Mono Variable / Inter Variable).

## Commands

```bash
npm run feed      # refresh snapshot: repos, commits, CI conclusion, npm version (checked into src/data)
npm run verify    # re-check every evidence link & demo URL → evidence-report.json (⚠ rows render honestly)
npm run check-data# schema gate: no claim without evidence, no banned phrases, links are https  (runs pre-build)
npm run build     # full static build (prebuild = check-data)
npm run dev       # dev server :4321
```

## Rules of the repo (enforced by scripts, not vibes)

1. A metric/claim on any page must reference an `src/data/evidence.json` id. New claim → new ledger row →
   new evidence URL. `check-data` fails the build otherwise.
2. Status chips (Live/Active/On hold) are *derived* from push dates and demo state — never typed.
3. Stats (stars, versions, CI) come from `npm run feed`; do not hand-edit numbers into copy.
4. The banned-phrase list in `scripts/check-data.mjs` is law.
5. `.github/workflows/verify-nightly.yml` opens an issue when links rot. Never silence it.

## Before public launch (owner tasks from the strategy, P0)

- [ ] Fix or relabel the Bijli Bacha Cloud Run demo (503 as of 2026-09-01) — it is not linked anywhere here until it is true.
- [ ] Set `SITE_URL` env at deploy for canonical/sitemap/OG; buy or point the domain.
- [ ] Drop a corrected `public/resume.pdf` (the link auto-appears in nav + /about when the file exists).
- [ ] Obtain written permission from Janjua Sports before naming them anywhere (currently unmentioned by design).
- [ ] Same-day profile sweep: GitHub bio/blog, LinkedIn headline, dev.to, Fiverr → this URL.
- [ ] Review all first-person copy (this copy was drafted against verified sources; he owns the final voice).

## Known limitations (honest, same section style as the repos)

- Palette fuzzy-matches commands, not full-text site search (by design: 12 verbs).
- Light theme implemented via tokens; not art-directed yet.
- OG images are pre-rendered PNGs for home + 5 studies; deep pages fall back to the site card.
- dev.to/Substack/Fiverr are external — no API health-check for them beyond the nightly HEAD.

## Implementation status (2026-09-01)

| Plan phase | State |
|---|---|
| Extras v3 | ✅ boot intro (once per session, reduced-motion safe), floating `ask` widget + /ask page (extractive TF-IDF over a build-time chunk index — no LLM, quotes only), lab pinned: FreeVerse → TruthCI → AegisRoute, footer profile row + subscribe |
| P1 foundation · P2 design system · P3 homepage · P4 hero case studies (xr, XRFM) · P5 supporting + /work + /lab · P6 terminal system · P7 credentials/writing/about/contact/colophon/404/RSS · P8 verifier (build + dev + nightly workflow) | ✅ implemented, `npm run build` green (14 pages) |
| P9 responsive | layout rules implemented per breakpoint spec; visual walkthrough pending owner eyes on the live preview |
| P10 SEO/perf | sitemap, robots, canonical, JSON-LD (Person/WebSite/SoftwareSourceCode), OG images, Lighthouse-grade budgets: static HTML, 4.7 KB gz JS island, 96 KB latin-subset fonts self-hosted. Set `SITE_URL` at deploy to finalize canonical/OG hosts |
| P11–P12 | owner tasks: proofread the copy (it was drafted against verified sources; voice needs his fingerprints), fix Bijli demo (kept off-site until true), resume.pdf drop-in, launch checklist in README above |

Deviations from plan (deliberate): palette/shell hand-rolled in vanilla JS instead of cmdk+React (beats the JS budget: 12 KB raw / 4.7 KB gz vs ~57 KB planned — strategy §15.2 pre-authorized "if over, palette → vanilla"); Tailwind replaced by hand-written token CSS (sanctioned by §11 wording); MDX content collections → typed `src/data/*.json` + zod gate (same guarantee, fewer deps); diagrams hand-authored SVG whose module names mirror the real repos instead of a mermaid-cli pipeline (single-source-of-truth rule preserved as a P2 upgrade).

