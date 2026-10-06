// Issue bodies are untrusted HTML once rendered: the allowlist in src/lib/markdown.ts
// is the only thing between an Issue and the page. Run with `pnpm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMarkdown } from "../src/lib/markdown.ts";

test("scripts, frames, forms and event handlers do not reach the page", async () => {
  const html = await renderMarkdown(
    [
      "<script>alert(1)</script>",
      '<iframe src="https://example.com"></iframe>',
      '<form action="/x"><button>go</button></form>',
      "<style>body { display: none }</style>",
      '<p onclick="alert(1)" style="color: red" id="top">kept text</p>',
      '<img src="x.png" onerror="alert(1)">',
    ].join("\n\n"),
  );
  assert.doesNotMatch(html, /<script|<iframe|<form|<button|<style|alert\(1\)|display: none/);
  assert.doesNotMatch(html, /onclick|onerror|style=|id=/);
  assert.match(html, /<p>kept text<\/p>/);
});

test("links keep only safe addresses", async () => {
  const html = await renderMarkdown(
    [
      "[script](javascript:alert(1))",
      "[data](data:text/html,x)",
      "[bare](other-page)",
      "[site](/blog/)",
      "[part](#part)",
      "[web](https://example.com/)",
      '<a href="vbscript:x" target="_blank" rel="opener">raw</a>',
    ].join("\n\n"),
  );
  assert.doesNotMatch(html, /javascript:|data:|vbscript:|other-page|target=|rel=/);
  assert.match(html, /<a>bare<\/a>/);
  assert.match(html, /<a href="\/blog\/">site<\/a>/);
  assert.match(html, /<a href="#part">part<\/a>/);
  assert.match(html, /<a href="https:\/\/example.com\/">web<\/a>/);
});

test("images load lazily unless the author chose otherwise", async () => {
  const html = await renderMarkdown(
    '![chart](https://example.com/a.png)\n\n<img src="https://example.com/b.png" loading="eager" decoding="bogus" width="10">',
  );
  assert.match(html, /<img src="https:\/\/example.com\/a.png" alt="chart" loading="lazy" decoding="async">/);
  assert.match(html, /<img src="https:\/\/example.com\/b.png" loading="eager" width="10" decoding="async">/);
});

test("task items show their state as text", async () => {
  const html = await renderMarkdown("- [x] done\n- [ ] open");
  assert.doesNotMatch(html, /<input/);
  assert.match(html, /☑ done/);
  assert.match(html, /☐ open/);
});

test("fenced code is colored; diagrams and unknown languages stay as written", async () => {
  const html = await renderMarkdown(
    ["```python", "x = 1  # one", "```", "", "```mermaid", "graph TD; A-->B", "```", "", "```nosuchlanguage", "<b>raw</b>", "```"].join("\n"),
  );
  assert.match(html, /<pre><code class="language-python syntax"><span class="line">/);
  assert.match(html, /--shiki-light:#[0-9A-Fa-f]{6}/);
  assert.match(html, /<pre><code class="language-mermaid">graph TD; A-->B\n<\/code><\/pre>/);
  assert.match(html, /<pre><code class="language-nosuchlanguage">&#x3C;b>raw&#x3C;\/b>\n<\/code><\/pre>/);
});

test("links and images inside the site follow the path the site lives under", async () => {
  const html = await renderMarkdown("[post](/blog/a/) [web](https://example.com/) [part](#x) ![pic](/assets/a.png)", "/notes");
  assert.match(html, /<a href="\/notes\/blog\/a\/">post<\/a>/);
  assert.match(html, /<a href="https:\/\/example.com\/">web<\/a>/);
  assert.match(html, /<a href="#x">part<\/a>/);
  assert.match(html, /<img src="\/notes\/assets\/a.png"/);
});
