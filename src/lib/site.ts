import { about, ideas, posts, repository, type Entry, type Tag } from "./content";
import { renderMarkdown } from "./markdown";
import { base, link, settings, url, type Link } from "./settings";
import { stringsFor } from "./strings";

const owner = repository.split("/")[0];
const options = settings.theme?.options ?? {};
const language = settings.site?.language || "en";

/** The interface text in the site's language. */
export const t = stringsFor(language);

// Nothing here is required in config.yaml: what is left out comes from the
// repository the Issues are in.
export const site = {
  title: settings.site?.title || owner,
  author: settings.site?.author || owner,
  description: settings.site?.description ?? "",
  language,
  repo: repository,
  bio: settings.profile?.bio ?? "",
  avatar: settings.profile?.avatar ?? "https://github.com/" + owner + ".png",
  links: (settings.profile?.links ?? []) as Link[],
  seo: {
    googleSearchConsole: settings.seo?.google_search_console ?? "",
    socialImage: settings.seo?.social_image ?? "",
    socialImageAlt: settings.seo?.social_image_alt ?? "",
  },
  comments: {
    enabled: settings.comments?.enabled ?? false,
    repo: settings.comments?.repo || repository,
    theme: options.comments_theme ?? "github-light",
    themeMode: options.comments_theme_mode ?? "auto",
  },
  pageSize: Math.max(1, settings.paths?.page_size ?? 10),
  tagline: options.tagline ?? "",
  footerText: options.footer_text ?? "",
  showPoweredBy: options.show_powered_by ?? true,
  accentColor: options.accent_color ?? "",
  accentColorDark: options.accent_color_dark ?? "",
};

/** The menu: site.navigation.items in config.yaml, or the sections that have content. */
export const navigation: Link[] = (
  settings.site?.navigation?.items ?? [
    { name: t.blog, url: "/blog/" },
    ...(ideas.length ? [{ name: t.ideas, url: "/ideas/" }] : []),
    { name: t.tags, url: "/tags/" },
    { name: t.about, url: "/about/" },
  ]
).map((item) => ({ name: item.name, url: link(item.url) }));

/** Posts chosen for Home by Issue number, in the order given; one that is not published is left out. */
export const featuredPosts: Entry[] = (options.featured_posts ?? [])
  .map((number) => posts.find((post) => post.issueNumber === number))
  .filter((post): post is Entry => Boolean(post));

/** Sanitized HTML of an Issue body, with links inside the site under its base path. */
export function render(markdown: string): Promise<string> {
  return renderMarkdown(markdown, base);
}

export interface TagPage extends Tag {
  path: string;
  posts: Entry[];
}

export function tagPath(tag: Tag): string {
  return "/tags/" + tag.key + "/";
}

/** Blog tags by key; the newest post's spelling names the tag. Ideas show tags but join no archive. */
export const tags: TagPage[] = (() => {
  const grouped = new Map<string, TagPage>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const page = grouped.get(tag.key) ?? { ...tag, path: tagPath(tag), posts: [] };
      page.posts.push(post);
      grouped.set(tag.key, page);
    }
  }
  return [...grouped.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
})();

export interface Archive {
  number: number;
  total: number;
  path: string;
  prev: string | null;
  next: string | null;
  posts: Entry[];
}

export function archivePath(number: number): string {
  return number === 1 ? "/blog/" : "/blog/page/" + number + "/";
}

/** The Blog in pages; an empty Blog has one page. */
export const archives: Archive[] = (() => {
  const total = Math.max(1, Math.ceil(posts.length / site.pageSize));
  return Array.from({ length: total }, (_, index) => ({
    number: index + 1,
    total,
    path: archivePath(index + 1),
    prev: index > 0 ? archivePath(index) : null,
    next: index + 1 < total ? archivePath(index + 2) : null,
    posts: posts.slice(index * site.pageSize, (index + 1) * site.pageSize),
  }));
})();

/** Every page of the site, for the sitemap. */
export function pagePaths(): string[] {
  return [
    "/",
    "/blog/",
    "/tags/",
    "/about/",
    ...(ideas.length ? ["/ideas/"] : []),
    ...posts.map((post) => post.path),
    ...ideas.map((idea) => idea.path),
    ...tags.map((tag) => tag.path),
    ...archives.slice(1).map((archive) => archive.path),
  ];
}

export { about, ideas, posts, url };
