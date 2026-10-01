import { defineConfig } from 'astro/config';

// BASE_PATH is set by the GitHub Pages workflow:
//  - "/mindsuitecms" when served from mjaffry01.github.io/mindsuitecms
//  - "/" once a custom domain (e.g. www.mindsuite.in) is attached
export default defineConfig({
  site: process.env.SITE_URL || 'https://mjaffry01.github.io',
  base: process.env.BASE_PATH || '/',
});
