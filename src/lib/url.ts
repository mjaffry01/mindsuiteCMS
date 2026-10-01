// Resolve CMS-entered links and image paths against the site's base path,
// so the same content works on github.io/<repo>/ and on a custom domain.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function href(p: string | undefined): string {
  if (!p) return `${BASE}/`;
  if (/^(https?:|mailto:|tel:)/i.test(p)) return p;
  if (p.startsWith('#')) return `${BASE}/${p}`;
  return `${BASE}/${p.replace(/^\//, '')}`;
}
