#!/usr/bin/env node
/**
 * scripts/a11y-check.mjs — FinFacts accessibility gate (WCAG 2.2 AA).
 *
 * Serves the built `dist/` directory with a tiny dependency-free static server
 * (clean-URL aware), then drives headless Chromium with Playwright and runs
 * axe-core against a representative set of pages. Fails (exit 1) when any page
 * has axe violations at impact level `serious` or `critical`.
 *
 * Run order: this expects `dist/` to already exist — build first
 *   (`npm run build` or the fast `SKIP_DATA_FETCH=1 npm run build`).
 *
 * Usage:
 *   node scripts/a11y-check.mjs
 *
 * Dependencies (devDependencies): playwright, @axe-core/playwright.
 * Playwright browsers must be installed once: `npx playwright install chromium`.
 *
 * Pages were chosen to cover each island/template family: home, a species page
 * (maps/charts), a lesson (MDX), explore, and the map page (WebGL island).
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.A11Y_PORT ?? 4321);

// Routes (clean URLs) to audit. Keep this in sync with the IA in src/pages.
const ROUTES = [
  '/',
  '/explore/',
  '/map/',
  '/species/carcharodon-carcharias/',
  '/lessons/biology-fundamentals/',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/** Resolve a request URL to a file inside dist, honoring clean URLs. */
async function resolveFile(urlPath) {
  // Strip query/hash and decode.
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  // Prevent path traversal.
  const safe = normalize(clean).replace(/^(\.\.[/\\])+/, '');
  const candidates = [];
  if (safe.endsWith('/')) {
    candidates.push(join(DIST, safe, 'index.html'));
  } else {
    candidates.push(join(DIST, safe));
    candidates.push(join(DIST, `${safe}.html`));
    candidates.push(join(DIST, safe, 'index.html'));
  }
  for (const c of candidates) {
    try {
      const s = await stat(c);
      if (s.isFile()) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const file = await resolveFile(req.url ?? '/');
      if (!file) {
        // SPA-style fallback to 404.html if present, else plain 404.
        const notFound = join(DIST, '404.html');
        try {
          const body = await readFile(notFound);
          res.writeHead(404, { 'Content-Type': MIME['.html'] });
          res.end(body);
        } catch {
          res.writeHead(404, { 'Content-Type': MIME['.txt'] });
          res.end('Not found');
        }
        return;
      }
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
        res.end(body);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': MIME['.txt'] });
        res.end(`Server error: ${err?.message ?? err}`);
      }
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function main() {
  // Confirm dist exists before doing anything expensive.
  try {
    const s = await stat(DIST);
    if (!s.isDirectory()) throw new Error('dist is not a directory');
  } catch {
    console.error(`[a11y] dist/ not found at ${DIST}. Run \`npm run build\` first.`);
    process.exit(1);
  }

  // Lazy import so a missing browser dependency yields a clear message and the
  // package install (not module load) is what determines availability.
  let chromium;
  let AxeBuilder;
  try {
    ({ chromium } = await import('playwright'));
    ({ default: AxeBuilder } = await import('@axe-core/playwright'));
  } catch (err) {
    console.error('[a11y] Missing dependencies. Install with: npm i -D playwright @axe-core/playwright && npx playwright install chromium');
    console.error(`[a11y] ${err?.message ?? err}`);
    process.exit(1);
  }

  const server = await startServer();
  const base = `http://127.0.0.1:${PORT}`;
  console.log(`[a11y] serving dist on ${base}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  let totalSerious = 0;
  const summaries = [];

  try {
    for (const route of ROUTES) {
      const page = await context.newPage();
      const url = `${base}${route}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 }).catch(async () => {
        // networkidle can hang on the WebGL map tile stream; fall back to load.
        await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
      });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      totalSerious += serious.length;
      summaries.push({ route, total: results.violations.length, serious });
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n[a11y] WCAG 2.2 AA results (serious/critical gate):');
  for (const s of summaries) {
    const flag = s.serious.length > 0 ? 'FAIL' : 'ok  ';
    console.log(`  [${flag}] ${s.route} — ${s.serious.length} serious/critical, ${s.total} total`);
    for (const v of s.serious) {
      console.log(`        - ${v.id} (${v.impact}): ${v.help} [${v.nodes.length} node(s)]`);
    }
  }

  if (totalSerious > 0) {
    console.error(`\n[a11y] FAILED: ${totalSerious} serious/critical violation(s).`);
    process.exit(1);
  }
  console.log('\n[a11y] PASSED: no serious/critical WCAG 2.2 AA violations.');
}

main().catch((err) => {
  console.error(`[a11y] unexpected error: ${err?.stack ?? err}`);
  process.exit(1);
});
