# MindSuite — CMS website

The MindSuite marketing site, rebuilt so non-developers can edit it in the browser.

- **Site:** [Astro](https://astro.build), static pages with animations, a live chart and hover effects.
- **CMS:** [Decap CMS](https://decapcms.org) at `/admin`. An admin signs in with GitHub, edits, and clicks **Publish**.
- **Hosting:** GitHub Pages. Every Publish is a commit to `main`, and the workflow in `.github/workflows/deploy.yml` rebuilds and redeploys in about a minute.

```
Admin → /admin → Publish → commit to main → GitHub Actions build → GitHub Pages (live)
```

## What the admin can edit

| In the CMS | What it controls |
|---|---|
| **Site settings** | Name, logo, accent colour, menu, contact details, footer |
| **Home page** | A list of sections. Add, remove, hide or **drag to reorder**. Each section type has its own fields |
| **Pages** | Free-form pages (Careers, Privacy, Terms…). New pages appear at `/<page-name>` |

Section types: animated hero, counting numbers, hover cards, chart (bar / line / doughnut, with editable data), tag cloud, text + checklist panel, scrolling partner names, rotating testimonials, call-to-action banner.

Animations and interactions live in code (`src/scripts/motion.ts`, `src/styles/global.css`); the CMS only edits content, so admins can't break them.

## One-time setup

### 1. Turn on GitHub Pages
Repo → **Settings → Pages → Source: GitHub Actions**. Push to `main` (or run the workflow) and the site appears at `https://mjaffry01.github.io/mindsuitecms/`.

### 2. Enable the admin login (GitHub OAuth helper)
GitHub Pages can't run server code, so the login uses a free Cloudflare Worker in `oauth-worker/`.

1. Create a GitHub OAuth App: GitHub → Settings → Developer settings → **OAuth Apps → New**.
   - Homepage URL: `https://mjaffry01.github.io/mindsuitecms/`
   - Authorization callback URL: `https://mindsuite-cms-auth.<your-subdomain>.workers.dev/callback`
2. Deploy the worker:
   ```bash
   cd oauth-worker
   npx wrangler deploy
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```
3. Put the worker URL in `public/admin/config.yml` → `backend.base_url`, and commit.
4. Anyone who should edit the site needs **write access to this repo** on GitHub.

### 3. Custom domain (optional)
Repo → Settings → Pages → Custom domain (e.g. `www.mindsuite.in`), then update the DNS CNAME. The workflow picks up the new base path automatically. Also update `site_url` in `public/admin/config.yml`, `ALLOWED_ORIGINS` in `oauth-worker/wrangler.toml`, and the OAuth App's homepage URL.

## Local development

```bash
npm install
npm run dev        # site at http://localhost:4321
npm run cms        # in a second terminal, then open http://localhost:4321/admin/
```
`npm run cms` runs Decap's local backend, so edits go to your local files without logging in.

## Project layout

```
public/admin/        Decap CMS (index.html + config.yml — the editing schema)
public/uploads/      Images uploaded through the CMS
src/data/site.json   Site settings (edited by the CMS)
src/data/home.json   Home page sections (edited by the CMS)
src/content/pages/   Markdown pages (edited by the CMS)
src/components/blocks/  One component per section type
src/scripts/motion.ts   Scroll reveals, counters, chart, parallax, slider
oauth-worker/        GitHub login helper for the CMS
```

### Adding a new section type (developer)
1. Create `src/components/blocks/MyBlock.astro` (receives the section as `b`).
2. Register it in `src/pages/index.astro`.
3. Add a matching entry under `types:` in `public/admin/config.yml`.

## Content to confirm
The copy was drafted from the current mindsuite.in homepage. Before going live, check it in the CMS: the **chart figures are sample data**, the contact **email is blank**, the Privacy/Terms pages are placeholders, and the testimonial wording should be checked with the client.
