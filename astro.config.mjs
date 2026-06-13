// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import pagefind from 'astro-pagefind';

// https://astro.build/config
export default defineConfig({
  // Static output: pages render to HTML with ~zero JS by default; interactive
  // widgets opt in via client:* directives (islands architecture).
  output: 'static',
  // Placeholder production URL; replace before go-live. Used for sitemap and
  // canonical/JSON-LD absolute URLs.
  site: 'https://finfacts.example.com',
  integrations: [
    mdx(),
    sitemap(),
    preact(),
    pagefind(),
  ],
});
