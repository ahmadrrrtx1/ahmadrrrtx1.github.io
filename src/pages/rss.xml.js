import rss from "@astrojs/rss";
import writing from "../data/writing.json";

export async function GET() {
  return rss({
    title: "Muhammad Ahmad — writing",
    description: "Measured, code-anchored writing on agentic systems, evals and audits.",
    site: import.meta.env.SITE,
    customData: `<language>en</language>`,
    items: writing.articles.map((a) => ({
      title: a.title,
      pubDate: new Date(a.date),
      link: a.url,
      description: a.proves,
    })),
  });
}
