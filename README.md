# Your Issue-based personal site

Write in GitHub Issues; this repository turns them into a website.
[escaping](https://github.com/geoqiao/escaping) writes your published Issues as Markdown files,
and the [Astro](https://astro.build/) site in this repository draws the pages. The site code is
yours: change anything in `src/` and `public/`.

## Start writing

1. Create your repository with **Use this template**. Name it `username.github.io`, or give it
   another name and the site lives at `username.github.io/<name>/`. On GitHub Free, keep it public.
2. In **Settings → Pages**, set **Source: GitHub Actions**. Then run the **Publish site** workflow
   once from the **Actions** tab; a run that started before this setting fails at its first step.
3. Write an Issue: a title and a Markdown body; image uploads work as usual.
4. Add exactly one of `type:blog`, `type:idea` or `type:about`, and `published` when it is ready.
   The workflow creates these labels on its first run. The label change publishes the site again.

Remove `published` to take an Issue down. Closing an Issue does not unpublish it. Only Issues by
the repository owner (or `github.allowed_authors`) are published.

If one Issue has a problem, for example an invalid tag, the rest of the site is still published.
The run is marked failed, and its summary names the Issue and what to fix. A failed run leaves the
site that was live before in place.

## Settings

Every setting in `config.yaml` is optional. Left empty, the title and author are the owner of
the repository, the avatar is the owner's GitHub avatar and the address is the one GitHub Pages
gives the repository. Remove the `#` in front of what you want to set:

```yaml
site:
  title: My notes
  language: zh # Also turns the interface text to Chinese.
profile:
  bio: One or two lines about you, shown on Home.
theme:
  options:
    tagline: Writing about tools and learning
    featured_posts: [12, 7]
```

`config.yaml` lists every setting. With a custom domain, set `site.url` to it.

## Change the look

| To change | Edit |
| --- | --- |
| Colors, type, spacing | `public/assets/css/style.css` |
| Interface text | `src/lib/strings.ts` |
| A page | `src/pages/` and `src/components/` |
| The frame of every page | `src/layouts/Base.astro` |
| How Markdown becomes HTML, and which HTML is allowed | `src/lib/markdown.ts` |

To write a different site from the same Issues, read
[Content Export v1](https://github.com/geoqiao/escaping/blob/main/docs/contracts/content-export-v1.md):
it defines the files in `content/`, and it is all a site needs to know.

## Preview on your computer

You need [uv](https://docs.astral.sh/uv/), Node 24 and [pnpm](https://pnpm.io/). The site is
served at http://localhost:4321.

```bash
GITHUB_TOKEN=$(gh auth token) uvx escaping-site@0.6.0 export --config config.yaml --repo OWNER/NAME --output content
pnpm install
pnpm dev
```

`pnpm test` checks that scripts and other unsafe HTML in an Issue do not reach a page. Run it
after you change `src/lib/markdown.ts`. `pnpm build` fails when a page links to an address of
the site that does not exist.

## Other hosts

The site is plain static files in `dist/`, so any static host works. A host that builds from the
repository, such as Cloudflare, never sees an Issue event. Let a workflow commit the Markdown
instead, and the push starts the host's build:

1. Remove the `/content/` line from `.gitignore`.
2. Replace `.github/workflows/pages.yml` with the workflow in escaping's
   [Deployment guide](https://github.com/geoqiao/escaping/blob/main/docs/deployment.md#commit-the-export-for-a-host-that-builds-on-push),
   with `--output content`.
3. Set `site.url` in `config.yaml`, and on the host set the build command `pnpm build` and the
   output folder `dist`.

## Versions

The workflow runs `escaping-site@0.6.0`. To update, change that version after reading the
[CHANGELOG](https://github.com/geoqiao/escaping/blob/main/CHANGELOG.md). The site code was
copied when you made this repository, so later changes to the template do not reach it; compare
with [escaping-template](https://github.com/geoqiao/escaping-template) when you want them.

Each job gets only the short-lived `GITHUB_TOKEN` permissions it needs; never put a token in
`config.yaml`.

## Licenses

The site code is MIT-licensed. `public/assets/escaping/mermaid/` and `public/assets/fonts/`
carry their own licenses. Choose a license for your own writing separately.
