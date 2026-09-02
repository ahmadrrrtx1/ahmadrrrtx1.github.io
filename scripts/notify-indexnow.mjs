// IndexNow: instant URL notification for Bing, Yandex, Naver, Seznam,
// Yep (and any engine that reads IndexNow). Runs after a Pages deploy.
// The key is public by design: the protocol verifies it by fetching
// /{key}.txt from the site root — that's how the engine proves the
// sender owns the host. Google ignores IndexNow for discovery; for
// Google the sitemap + GSC remain the path (see deploy notes in README).
const HOST = "ahmadrrrtx1.github.io";
const KEY = "18e4643ac4128c070393d711ab9896f5";
async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": "rrrtx-deploy-ping" } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

try {
  const xml = await get(`https://${HOST}/sitemap-0.xml`);
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urlList.length < 10) throw new Error(`sitemap looks truncated (${urlList.length} urls) — not pinging`);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList,
    }),
  });
  // 200 = processed, 202 = accepted for processing. Both fine.
  if (res.status === 200 || res.status === 202) {
    console.log(`indexnow: HTTP ${res.status} — ${urlList.length} urls delivered to Bing/Yandex/Naver/Seznam`);
  } else {
    console.log(`indexnow: HTTP ${res.status} ${(await res.text()).slice(0, 160)} — non-blocking`);
  }
} catch (e) {
  console.log(`indexnow: skipped (${e.message}) — non-blocking`);
}
process.exit(0);
