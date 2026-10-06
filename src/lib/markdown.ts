import type { Element, ElementContent, Root } from "hast";
import { toString } from "hast-util-to-string";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { type Options as Schema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { bundledLanguages, codeToHast } from "shiki";
import { unified } from "unified";
import { visit } from "unist-util-visit";

// Issue bodies are authored Markdown with raw HTML. Everything outside this
// allowlist is unwrapped; the elements under `strip` go with their content.
const schema: Schema = {
  tagNames: [
    "p", "div", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "dl", "dt", "dd",
    "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption", "colgroup", "col",
    "a", "span", "em", "strong", "code", "pre", "img", "blockquote", "del", "ins", "sub", "sup",
    "mark", "small", "abbr", "cite", "q", "kbd", "samp", "var", "time", "s", "u",
    "section", "article", "header", "footer", "aside", "nav", "figure", "figcaption",
    "details", "summary", "hgroup", "wbr",
  ],
  attributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    td: ["colSpan", "rowSpan", "align"],
    th: ["colSpan", "rowSpan", "align", "scope"],
    col: ["span", "align"],
    colgroup: ["span"],
    time: ["dateTime"],
    q: ["cite"],
    blockquote: ["cite"],
    del: ["cite", "dateTime"],
    ins: ["cite", "dateTime"],
    code: ["className"],
    pre: ["className"],
    span: ["className"],
    div: ["className"],
    section: ["className"],
    article: ["className"],
    header: ["className"],
    footer: ["className"],
    aside: ["className"],
    details: ["open"],
  },
  protocols: {
    href: ["http", "https", "mailto", "tel", "ftp", "ftps"],
    src: ["http", "https", "ftp", "ftps"],
    cite: ["http", "https", "ftp", "ftps"],
  },
  strip: [
    "script", "style", "iframe", "object", "form", "button", "textarea", "select", "option",
    "applet", "frameset", "noscript", "template", "slot",
  ],
  ancestors: {},
  clobber: [],
  allowComments: false,
  allowDoctypes: false,
};

/** A task item's state is shown as text; the allowlist has no <input>. */
function taskListText() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "input" || node.properties.type !== "checkbox") return;
      if (!parent || index === undefined) return;
      parent.children[index] = { type: "text", value: node.properties.checked ? "☑" : "☐" };
    });
  };
}

const ENUMS: Record<string, string[]> = {
  loading: ["eager", "lazy"],
  decoding: ["async", "auto", "sync"],
};

function linksAndImages(options: { base: string }) {
  const inSite = (value: unknown) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "a") {
        const href = String(node.properties.href ?? "").trim();
        // A bare relative link has no stable base in a static site. Keep the
        // text, but do not emit a broken link.
        if (href && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) delete node.properties.href;
        // A link to a page of this site follows the site when it lives under a path.
        else if (inSite(href)) node.properties.href = options.base + href;
      }
      if (node.tagName === "img") {
        if (inSite(node.properties.src)) node.properties.src = options.base + node.properties.src;
        for (const [name, allowed] of Object.entries(ENUMS)) {
          const value = String(node.properties[name] ?? "").trim().toLowerCase();
          if (allowed.includes(value)) node.properties[name] = value;
          else delete node.properties[name];
        }
        node.properties.loading ??= "lazy";
        node.properties.decoding ??= "async";
      }
    });
  };
}

function languageOf(code: Element): string | undefined {
  const classes = code.properties.className;
  if (!Array.isArray(classes)) return undefined;
  const name = classes.map(String).find((value) => value.startsWith("language-"));
  return name?.slice("language-".length);
}

/** Color fenced code at build time. Mermaid and unknown languages stay plain text. */
function syntax() {
  return async (tree: Root) => {
    const blocks: Element[] = [];
    visit(tree, "element", (node, _index, parent) => {
      if (node.tagName === "code" && parent?.type === "element" && parent.tagName === "pre") {
        blocks.push(node);
      }
    });
    for (const code of blocks) {
      const language = languageOf(code)?.toLowerCase();
      if (!language || language === "mermaid" || !(language in bundledLanguages)) continue;
      const source = toString(code);
      const highlighted = await codeToHast(source, {
        lang: language,
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      });
      const pre = highlighted.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "pre",
      );
      const inner = pre?.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "code",
      );
      if (!inner || toString(inner) !== source) continue;
      code.children = inner.children as ElementContent[];
      code.properties.className = [`language-${language}`, "syntax"];
    }
  };
}

function processor(base: string) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(taskListText)
    .use(rehypeSanitize, schema)
    .use(linksAndImages, { base })
    .use(syntax)
    .use(rehypeStringify);
}

const cache = new Map<string, Promise<string>>();

/**
 * Sanitized HTML of an Issue body. `base` is the path the site lives under
 * ("" or "/notes"); links to pages of the site get it in front.
 */
export function renderMarkdown(markdown: string, base = ""): Promise<string> {
  const key = base + "\n" + markdown;
  let html = cache.get(key);
  if (!html) {
    html = processor(base).process(markdown).then(String);
    cache.set(key, html);
  }
  return html;
}
