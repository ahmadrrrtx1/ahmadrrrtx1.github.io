const https = require("https");
const { JSDOM } = require("jsdom");
const B = "https://ahmadrrrtx1.github.io";
function get(u) {
  return new Promise((resolve, reject) => {
    https.get(u, { headers: { "user-agent": "Mozilla/5.0" } }, (r) => {
      let body = "";
      r.on("data", (c) => { body += c; });
      r.on("end", () => resolve({ code: r.statusCode, body, hsts: Boolean(r.headers["strict-transport-security"]) }));
    }).on("error", reject);
  });
}
const routes = ["/", "/work/", "/work/xr/", "/work/xr-foundation-model/", "/work/gemma-monitor/", "/work/civicshield/", "/work/commit-canvas/", "/lab/", "/writing/", "/credentials/", "/about/", "/contact/", "/colophon/", "/ask/", "/privacy/", "/cookies/", "/rss.xml", "/sitemap-index.xml", "/sitemap-0.xml", "/robots.txt", "/llms.txt", "/security.txt", "/favicon.svg", "/apple-touch-icon.png", "/og/site.png", "/og/xr.png", "/data/chat-index.json", "/data/evidence-report.json", "/nope-does-not-exist/"];
(async () => {
  const results = await Promise.all(routes.map((u) => get(B + u)));
  const bad = [];
  results.forEach((r, i) => { const exp = routes[i].includes("nope") ? 404 : 200; if (r.code !== exp) bad.push(routes[i] + "→" + r.code); });
  console.log("ROUTES:", routes.length - bad.length + "/" + routes.length, bad.length ? "BAD " + bad.join(" ") : "— all expected codes");
  console.log("HSTS:", results[0].hsts);
  const sm = results[18].body.match(/<loc>([^<]+)<\/loc>/g).map((s) => s.slice(5, -6));
  const smr = await Promise.all(sm.map((u) => get(u)));
  console.log("SITEMAP:", smr.filter((r) => r.code === 200).length + "/" + sm.length, "urls resolve; host ok:", !results[18].body.includes("localhost"));
  const contentRoutes = routes.slice(0, 16);
  const pages = await Promise.all(contentRoutes.map((u) => get(B + u)));
  const titles = new Set(); const descs = new Set(); const seoBad = [];
  pages.forEach((p, i) => {
    const u = contentRoutes[i];
    const t = (p.body.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    const d = (p.body.match(/name="description" content="([^"]*)"/) || [])[1] || "";
    const c = (p.body.match(/rel="canonical" href="([^"]*)"/) || [])[1] || "";
    const h1 = (p.body.match(/<h1/g) || []).length;
    if (titles.has(t)) seoBad.push("dup title@" + u);
    if (descs.has(d)) seoBad.push("dup desc@" + u);
    titles.add(t); descs.add(d);
    if (h1 !== 1) seoBad.push(u + " h1=" + h1);
    const want = u === "/" ? B + "/" : B + u;
    if (c !== want) seoBad.push("canon@" + u + "=" + c);
    if (t.length < 12 || t.length > 70) seoBad.push("titlelen@" + u + "=" + t.length);
  });
  console.log("SEO METAS:", seoBad.length ? seoBad.join(" | ") : "16/16 unique titles + descriptions, one h1, exact canonicals ✓");
  const ld = JSON.parse(pages[0].body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const faq = ld["@graph"].find((x) => x["@type"] === "FAQPage");
  console.log("JSON-LD:", ld["@graph"].map((x) => x["@type"]).join(", "), "| sameAs:", ld["@graph"][0].sameAs.length, "| faq Qs:", faq.mainEntity.length, "| @id graph links:", JSON.stringify(ld).includes("#rrrtx"));
  const dom = await JSDOM.fromURL(B + "/", { runScripts: "dangerously", pretendToBeVisual: true, beforeParse(w) { w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }); w.fetch = (u, ...a) => (u.startsWith("http") ? u : B + u) === u ? fetch(u, ...a).then(async (r) => ({ ok: r.ok, json: () => r.json() })) : fetch(B + u, ...a).then(async (r) => ({ ok: r.ok, json: () => r.json() })); } });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 2600));
  w.document.getElementById("nav-btn").click();
  const hid = w.document.documentElement.getAttribute("data-nav");
  w.document.getElementById("nav-btn").click();
  w.document.getElementById("ask-btn").click();
  await new Promise((r) => setTimeout(r, 900));
  w.document.getElementById("ask-q").value = "what is xr";
  w.document.getElementById("ask-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 900));
  console.log("LIVE INTERACTION: boot removed:", !w.document.getElementById("boot"), "| nav hides:", hid === "hidden", "| ask results:", w.document.querySelectorAll("#ask-out .res").length, "| index:", w.document.getElementById("ask-n").textContent.slice(0, 40));
  w.close();
})().catch((e) => { console.log("SWEEP FAIL:", e.message); process.exit(1); });
