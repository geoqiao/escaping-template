import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

export interface Link {
  name: string;
  url: string;
}

/**
 * The parts of config.yaml this site reads. escaping reads github, about and
 * security from the same file and ignores the rest; this site ignores those.
 */
export interface Settings {
  site?: {
    title?: string;
    url?: string;
    author?: string;
    description?: string;
    language?: string;
    navigation?: { items?: Link[] };
  };
  profile?: { bio?: string; avatar?: string; links?: Link[] };
  paths?: { page_size?: number };
  seo?: { google_search_console?: string; social_image?: string; social_image_alt?: string };
  comments?: { enabled?: boolean; repo?: string };
  theme?: {
    options?: {
      tagline?: string;
      featured_posts?: number[];
      footer_text?: string;
      show_powered_by?: boolean;
      accent_color?: string;
      accent_color_dark?: string;
      comments_theme?: string;
      comments_theme_mode?: "auto" | "fixed";
    };
  };
}

const file = resolve(process.cwd(), "config.yaml");
export const settings: Settings = (existsSync(file) ? parse(readFileSync(file, "utf8")) : null) ?? {};

// The address of the site: site.url in config.yaml, or SITE_URL, which the
// workflow sets to the address GitHub Pages gives the repository.
const address = new URL(settings.site?.url || process.env.SITE_URL || "http://localhost:4321/");

/** Scheme and host without a trailing slash, e.g. https://alice.github.io */
export const origin = address.origin;

/** The path the site lives under without a trailing slash: "" or "/notes". */
export const base = address.pathname.replace(/\/+$/, "");

/** A path of this site as a link, e.g. url("/blog/") gives "/notes/blog/". */
export function url(path: string): string {
  return base + path;
}

/** A link from config.yaml: a path of this site, or any other address as written. */
export function link(target: string): string {
  return target.startsWith("/") && !target.startsWith("//") ? url(target) : target;
}

/** The full address of a path of this site. */
export function absolute(path: string): string {
  return origin + base + path;
}
