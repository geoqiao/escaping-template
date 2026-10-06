import type { APIRoute } from "astro";
import { absolute } from "../lib/settings";

export const GET: APIRoute = () =>
  new Response("User-agent: *\nAllow: /\nSitemap: " + absolute("/sitemap.xml") + "\n");
