import type { APIRoute } from "astro";
import { ideas, posts, url } from "../lib/site";

// Read by /assets/js/search.js: titles, summaries and tags of published content.
export const GET: APIRoute = () => {
  const items = [...posts, ...ideas].map((entry) => ({
    title: entry.title,
    description: entry.description,
    tags: entry.tags.map((tag) => tag.name),
    type: entry.type === "blog" ? "Blog" : "Idea",
    url: url(entry.path),
  }));
  return new Response(JSON.stringify({ version: 1, items }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
