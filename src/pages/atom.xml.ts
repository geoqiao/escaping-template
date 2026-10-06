import type { APIRoute } from "astro";
import { escapeHtml } from "../lib/html";
import { absolute } from "../lib/settings";
import { posts, render, site } from "../lib/site";

/** Every Blog post, newest first, with its full text (RFC 4287). */
export const GET: APIRoute = async () => {
  const home = absolute("/");
  // The feed's time is the latest post update, so an unchanged Blog gives an unchanged feed.
  const updated = posts.map((post) => post.updatedAt).sort().at(-1) ?? "1970-01-01T00:00:00Z";
  const entries = await Promise.all(
    posts.map(async (post) => {
      const address = escapeHtml(absolute(post.path));
      return (
        "<entry><id>" + address + "</id><title>" + escapeHtml(post.title) + "</title>" +
        '<link rel="alternate" type="text/html" href="' + address + '" />' +
        "<summary>" + escapeHtml(post.description) + "</summary>" +
        "<published>" + post.publishedAt + "</published><updated>" + post.updatedAt + "</updated>" +
        '<content type="html">' + escapeHtml(await render(post.markdown)) + "</content></entry>"
      );
    }),
  );
  const xml =
    "<?xml version='1.0' encoding='utf-8'?>\n" + '<feed xmlns="http://www.w3.org/2005/Atom">' +
    "<id>" + escapeHtml(home) + "</id><title>" + escapeHtml(site.title) + "</title>" +
    '<link rel="self" type="application/atom+xml" href="' + escapeHtml(absolute("/atom.xml")) + '" />' +
    '<link rel="alternate" type="text/html" href="' + escapeHtml(home) + '" />' +
    "<author><name>" + escapeHtml(site.author) + "</name></author>" +
    (site.description ? "<subtitle>" + escapeHtml(site.description) + "</subtitle>" : "") +
    "<updated>" + updated + "</updated>" + entries.join("") + "</feed>";
  return new Response(xml, { headers: { "content-type": "application/atom+xml; charset=utf-8" } });
};
