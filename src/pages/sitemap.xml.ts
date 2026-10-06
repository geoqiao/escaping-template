import type { APIRoute } from "astro";
import { escapeHtml } from "../lib/html";
import { absolute } from "../lib/settings";
import { pagePaths } from "../lib/site";

export const GET: APIRoute = () => {
  const urls = pagePaths()
    .map((path) => "<url><loc>" + escapeHtml(absolute(path)) + "</loc></url>")
    .join("");
  return new Response(
    "<?xml version='1.0' encoding='utf-8'?>\n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls + "</urlset>",
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
};
