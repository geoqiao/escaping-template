import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

// The folder `escaping-site export` writes. Its files are defined by Content Export v1:
// https://github.com/geoqiao/escaping/blob/main/docs/contracts/content-export-v1.md
const contentDir = resolve(process.cwd(), process.env.CONTENT_DIR ?? "content");
const SUPPORTED_EXPORT_VERSION = 1;

export interface Tag {
  name: string;
  key: string;
}

/** A Blog post or an Idea. */
export interface Entry {
  type: "blog" | "idea";
  issueNumber: number;
  title: string;
  description: string;
  createdDate: string;
  /** The day the author last revised it; equal to createdDate when never. */
  updateDate: string;
  publishedAt: string;
  updatedAt: string;
  tags: Tag[];
  markdown: string;
  /** The address inside the site, before the site's base path. */
  path: string;
}

export interface About {
  issueNumber: number;
  title: string;
  description: string;
  markdown: string;
}

interface Manifest {
  export_version: number;
  repository: string;
  blog: { issue_number: number; slug: string; path: string }[];
  ideas: { issue_number: number; path: string }[];
  about: { issue_number: number; path: string } | null;
  skipped_issues: number[];
}

function readEntry(path: string): { data: Record<string, any>; markdown: string } {
  const text = readFileSync(resolve(contentDir, path), "utf8");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) throw new Error(path + " has no front matter");
  return { data: parse(match[1]), markdown: text.slice(match[0].length).replace(/^\n/, "") };
}

function loadManifest(): Manifest {
  const file = resolve(contentDir, "manifest.json");
  if (!existsSync(file)) {
    throw new Error(
      "No content at " + contentDir + '. Run "uvx escaping-site export --config config.yaml --output content" first (see README.md).',
    );
  }
  const manifest = JSON.parse(readFileSync(file, "utf8")) as Manifest;
  if (manifest.export_version !== SUPPORTED_EXPORT_VERSION) {
    throw new Error(
      "Content export version " + manifest.export_version + " is not supported; this site reads version " + SUPPORTED_EXPORT_VERSION + ".",
    );
  }
  return manifest;
}

function entry(file: string, path: (data: Record<string, any>) => string): Entry {
  const { data, markdown } = readEntry(file);
  return {
    type: data.type,
    issueNumber: data.issue_number,
    title: data.title,
    description: data.description ?? "",
    createdDate: data.created_date,
    updateDate: data.update_date,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
    tags: data.tags ?? [],
    markdown,
    path: path(data),
  };
}

const manifest = loadManifest();

/** The repository the Issues are in (owner/name); comments live there too. */
export const repository = manifest.repository;

/** Blog posts, newest first: the order of the manifest. */
export const posts: Entry[] = manifest.blog.map((item) => entry(item.path, (data) => "/blog/" + data.slug + "/"));

/** Ideas, newest first. */
export const ideas: Entry[] = manifest.ideas.map((item) => entry(item.path, (data) => "/ideas/" + data.issue_number + "/"));

export const about: About | null = manifest.about
  ? (() => {
      const { data, markdown } = readEntry(manifest.about.path);
      return {
        issueNumber: data.issue_number,
        title: data.title,
        description: data.description ?? "",
        markdown,
      };
    })()
  : null;
