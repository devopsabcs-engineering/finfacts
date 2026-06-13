<!-- markdownlint-disable-file -->
# Subagent Research: Web Tech Stack for Shark Education Site (FinFacts)

Status: Complete
Date: 2026-06-13
Audience: College-level marine biology students + serious high schoolers
Org context: devopsabcs-engineering (GitHub) — Azure + GitHub Actions are natural fits
Site needs: species catalog/explorer (500+ species), interactive distribution maps, rich imagery/video, quizzes, scientific citations, strong performance/SEO/accessibility. Greenfield (README.md only).

## Research Topics / Questions

1. Site architecture options & trade-offs (SSG/JAMstack vs full-stack vs CMS); why Astro fits content-heavy educational sites; content management (MDX content collections vs headless CMS).
2. Interactive mapping libraries (Leaflet, MapLibre GL JS, Mapbox GL JS, deck.gl); rendering GBIF/OBIS occurrences + IUCN range polygons; free tile/basemap sources & terms.
3. Engaging UI/data-viz (D3, Observable Plot, Chart.js); shark size vs human / depth-zone visuals; large-catalog search/filter (Pagefind, Fuse.js, Algolia/Typesense).
4. Media handling (responsive images, lazy loading, video self-host vs YouTube/Vimeo, 3D glTF/model-viewer; image pipelines: Astro assets/Sharp/Cloudinary).
5. Accessibility (WCAG 2.2 AA), SEO (schema.org educational/scientific structured data), performance (Core Web Vitals).
6. Hosting/deployment (Azure Static Web Apps, Netlify, Vercel, GitHub Pages, Cloudflare Pages) free tiers + CI/CD; Azure SWA + GitHub Actions fit for devopsabcs-engineering.
7. Recommended concrete stack + sample project structure.

---

## Executive Summary — Recommended Stack

| Layer | Recommendation | Why |
|---|---|---|
| Framework / SSG | Astro (static output, islands) | Content-heavy, ships ~zero JS by default, MDX content collections with Zod schema validation, partial hydration for the few interactive widgets (maps, quizzes, charts). |
| Content model | Markdown/MDX Content Collections (git-based) for species + lessons; optionally Decap CMS (git-backed, MIT) for non-technical editors | Free, versioned, type-safe, reviewable via PRs, no DB/infra. Scales to tens of thousands of entries. |
| Mapping | MapLibre GL JS (BSD-3, free) + deck.gl for large occurrence point layers | Fully open source, no per-load billing, WebGL vector rendering. deck.gl handles 100k+ GBIF/OBIS points. |
| Occurrence data | GBIF + OBIS REST APIs (pre-baked to GeoJSON at build, or MVT tiles at runtime) | Authoritative, free, no-auth GET. OBIS even serves `.mvt` tiles directly. |
| Basemap tiles | Esri World Ocean Base (free, attribution) for bathymetry + OSM/MapTiler for land | Marine-appropriate, free with attribution. |
| Charts / data-viz | Observable Plot (ISC) for most charts; D3 (ISC/BSD) for bespoke (size-vs-human, depth zones) | Plot is concise & accessible; D3 for custom interactive SVG. |
| Search | Pagefind (MIT) for full-text site search; Fuse.js (Apache-2.0) for instant client-side catalog filtering | Pagefind handles 10k pages in <300 kB payload; Fuse.js gives fuzzy in-page filter. |
| Media | Astro built-in `<Image>`/`<Picture>` (Sharp) for responsive images; self-host short clips or embed YouTube/Vimeo lite; `<model-viewer>` (Apache-2.0) for glTF anatomy | Build-time optimization, lazy loading, no runtime cost. |
| Hosting / CI | Azure Static Web Apps (Free tier) + GitHub Actions | Org-aligned, free hosting, free SSL, custom domains, PR preview environments, native GitHub workflow. |

Key decisions: Astro (framework) · MapLibre GL JS + deck.gl (mapping) · Azure Static Web Apps + GitHub Actions (hosting). All core tools are open source / free-tier; no per-map-load billing trap.

---

## 1. Site Architecture Options & Trade-offs

### The three broad approaches

| Approach | Examples | Best for | Drawbacks for this site |
|---|---|---|---|
| Static / JAMstack (SSG) | Astro, Eleventy, Hugo, Next.js static export | Content-heavy, mostly-read sites; great SEO/perf; cheap/free hosting | Interactive features need explicit hydration; no per-request server logic without an adapter |
| Full-stack (SSR) | Next.js App Router, Remix/React Router | Personalization, auth, dynamic data per request | Heavier JS payloads by default; needs a running server/serverless runtime; higher hosting cost/complexity — overkill for read-only educational content |
| CMS-driven / monolith | WordPress, Drupal | Non-technical editors, plugin ecosystem | Heavy, plugin/security maintenance, slower Core Web Vitals unless heavily tuned; PHP hosting |

For a read-mostly, content-rich educational catalog, the static/JAMstack approach wins on performance, SEO, cost (free static hosting), security (no server attack surface), and longevity. The few dynamic bits (maps, quizzes, search) are client-side islands fed by pre-built data.

### Why Astro is the strongest fit (verified against current Astro docs)

- Islands architecture — Astro pioneered/popularized "component islands." By default every UI component renders to static HTML with zero client-side JS; you opt specific widgets into interactivity with `client:*` directives ([client:load, client:idle, client:visible](https://docs.astro.build/en/concepts/islands/)). For this site that means the species article, citations, and most pages ship no JS, while the map / quiz / chart islands hydrate independently and lazily (e.g. `client:visible` so a map only loads when scrolled into view). Source: [Astro — Islands architecture](https://docs.astro.build/en/concepts/islands/).
- Content Collections — `defineCollection()` + a `loader` (`glob()` / `file()`) + a Zod schema gives type-safe, validated content with autocomplete and build-time errors if an entry is malformed. Docs explicitly state collections are "suitable for tens of thousands of content entries" and cached between builds — comfortably covers 500+ species. Query with `getCollection()` / `getEntry()`, render MDX with `render()`. Source: [Astro — Content collections](https://docs.astro.build/en/guides/content-collections/).
- MDX — species pages can mix Markdown prose with interactive components (`<DistributionMap/>`, `<SizeComparison/>`, `<Quiz/>`), and Astro processes images and MDX at build time.
- Framework-agnostic islands — you can use React, Preact, Svelte, Vue, or Solid for individual islands and mix them. Most projects stick to one; Preact/Svelte keep island payloads tiny.
- `reference()` — schema can reference other collections (e.g. a species references its `family`, `citations`, or `relatedSpecies`), enabling relational content without a database.

Astro drawbacks: smaller ecosystem than Next.js; SSR/dynamic features require an adapter; team must learn Astro's component model. None are blockers for a static educational site.

### Why not the alternatives here

- Next.js (App Router) / Remix — excellent, but ship a React runtime and are oriented to app-like SSR; more JS, more hosting complexity than needed for read-only content. Next.js static export is viable but you lose much of Next's reason-for-being and still carry React overhead vs Astro's zero-JS default.
- Hugo — blazing fast builds, but Go templating is less ergonomic for rich interactive components and MDX-style embedded widgets; weaker islands story.
- Eleventy (11ty) — superb lightweight SSG (JS), great for content; but you'd assemble the interactivity/islands/image story yourself. A fine runner-up if the team prefers minimal tooling. Astro gives more batteries-included (images, collections, islands) out of the box.

---

## 2. Content Management — Markdown/MDX vs Headless CMS

### Option A (recommended): Git-based Markdown/MDX content collections

- What: species and lessons live as `.md`/`.mdx` files in the repo, validated by an Astro Zod schema.
- Cost/license: free (your repo).
- Why it fits a small scientific team: content is version-controlled, diffable, and reviewable via pull requests — ideal for citations and scientific accuracy (a domain expert can review changes). No database, no CMS to host/patch/secure. Type-safe schema prevents malformed entries (e.g. missing `iucnStatus` or `maxLengthCm`).
- Drawbacks: editing requires git literacy (mitigated by Decap CMS below or web-based editing in GitHub).

### Option B: Add a git-backed editing UI — Decap CMS (formerly Netlify CMS)

- What: open-source (MIT) admin UI that commits Markdown back to your git repo; runs as a static `/admin` page.
- Why: gives non-technical contributors a friendly form-based editor while keeping the git-based, PR-reviewable workflow and zero backend (uses GitHub OAuth). Best of both worlds for a small team with some non-coders.
- Drawbacks: OAuth setup; editorial workflow less polished than commercial SaaS; project maintenance pace has varied (verify current status — see Next Research).

### Option C: Headless SaaS CMS (Sanity / Contentful / Strapi)

| CMS | Model | Cost | Fit / Drawback |
|---|---|---|---|
| Sanity | Hosted content lake + real-time Studio (open-source, self-hostable) | Generous free tier | Great structured-content + image CDN; overkill unless you need real-time multi-editor collaboration. Adds an external dependency + API fetch at build. |
| Contentful | Hosted, API-first | Free tier (limited) | Polished, but proprietary lock-in and cost scaling; more than a small team needs. |
| Strapi | Self-hosted, open-source (Node) | Free software, you host it | Full control but you must run/secure a server + DB — defeats the zero-infra advantage. |

Recommendation: Start with git-based MDX content collections (Option A). If non-technical editors need a UI, layer on Decap CMS (Option B). Reach for a headless SaaS only if editorial scale/collaboration demands it. Astro can also pull from any CMS via a content loader if you migrate later — low switching cost.

---

## 3. Interactive Mapping Libraries

### Library comparison

| Library | License / Cost | Rendering | Fit | Drawbacks |
|---|---|---|---|---|
| MapLibre GL JS | BSD-3-Clause, fully free (community fork of Mapbox GL JS v1 before it went proprietary) | WebGL vector tiles | Recommended base. No API key, no per-load billing. Smooth zoom/pan, styling via MapLibre Style Spec, huge plugin ecosystem. Current v5.x. | You supply tiles/styles (free options exist). WebGL required. |
| Mapbox GL JS | Proprietary (v2+). Free tier 50,000 map loads/month, then billed per load; some uses need a commercial license | WebGL vector | Polished styles & Studio, but billing/license risk if traffic grows; not ideal for a free educational site. | Cost scaling; vendor lock-in; requires access token. |
| Leaflet | BSD-2, free | Raster (DOM/Canvas) | Simplest API, tiny, great for basic marker/polygon maps; massive plugin ecosystem | No native vector-tile GPU rendering; struggles with very large point sets; less smooth at scale. |
| deck.gl | MIT, free (vis.gl / OpenJS) | WebGL2/WebGPU GPU layers | Pair with MapLibre for large occurrence datasets — `ScatterplotLayer`/`HexagonLayer`/`GridLayer` render 100k+ points performantly with aggregation/heatmaps | Steeper API; heavier bundle (load as an island only on map pages). |

Verdict: MapLibre GL JS as the base map engine (free, no billing trap), with deck.gl overlaid for dense occurrence/tracking layers. Use Leaflet only if you want the absolute simplest implementation and datasets stay small. Avoid Mapbox GL JS as the default to dodge per-load billing and the proprietary license. Sources: [MapLibre GL JS docs](https://maplibre.org/maplibre-gl-js/docs/), [Mapbox pricing (50k free loads)](https://www.mapbox.com/pricing).

### Rendering GBIF/OBIS occurrences & IUCN ranges

- GBIF ([api.gbif.org](https://techdocs.gbif.org/en/openapi/)) — RESTful, JSON, mostly no-auth GET. `occurrence/search` for paged points; request a Download (up to 100k filters) for large per-species datasets to get proper citation DOIs and avoid rate limits (HTTP 429 on heavy search). There's also a GBIF Maps API v2 that serves ready-made occurrence map tiles. Set a `User-Agent` with contact info. For a static site: pre-fetch each species' occurrences at build time → bake to GeoJSON (or precompute density tiles), avoiding runtime API load. Source: [GBIF API reference](https://techdocs.gbif.org/en/openapi/).
- OBIS (marine-specific, [api.obis.org](https://api.obis.org/)) — `/occurrence/points` (GeoJSON, Geohash-aggregated, ≤100k features), `/occurrence/grid/{precision}` (gridded GeoJSON), and crucially `/occurrence/tile/{x}/{y}/{z}.mvt` which serves Mapbox Vector Tiles directly — perfect to plug straight into a MapLibre source for live, zoom-aware occurrence layers. Also `/checklist/redlist` for IUCN Red List species and `/statistics/env` for depth/SST/SSS bins (great for depth-range charts). Source: [OBIS API v3](https://api.obis.org/).
- IUCN range polygons — IUCN Red List provides species range maps (spatial data) under their terms; render as GeoJSON/vector polygon layers. Requires an IUCN account/API token and adherence to their data-use terms (attribution; some redistribution limits). For static rendering, simplify polygons (e.g. mapshaper) and store as GeoJSON in the repo. (Verify current IUCN API terms before shipping — see Clarifying Questions.)

### Free tile / basemap sources & terms

| Source | What | Terms |
|---|---|---|
| OpenStreetMap raster/standard | Land/coast basemap | Free; ODbL data + attribution required; respect tile-usage policy (don't hammer OSM's own tile server for production — use a provider or self-host/MapTiler). |
| Esri World Ocean Base | Bathymetry-focused marine basemap (built partly from GEBCO) | Free to use as basemap with Esri attribution; "not for navigation"; tile export restricted. Ideal marine backdrop. Source: [Esri World Ocean Base](https://www.arcgis.com/home/item.html?id=1e126e7520f9466c9ca28b8f28b5e500). |
| GEBCO | Global gridded bathymetry data | Free; attribution; you'd render the grid yourself or via a WMS — heavier. Often easier to consume via Esri Ocean Base which already incorporates GEBCO. |
| EMODnet Bathymetry | High-res European bathymetry WMTS/WMS | Free with attribution; great for European waters. |
| MapTiler | Hosted OSM-based vector tiles + styles | Free tier (API key, monthly limits); easiest way to get MapLibre-ready vector tiles legally without self-hosting. |

Practical pairing: Esri World Ocean Base (bathymetry) under occurrence layers, with MapTiler or OSM-based land labels, all attributed in the map UI.

---

## 4. Engaging UI & Data-Viz

### Chart libraries

| Tool | License | Fit | Drawback |
|---|---|---|---|
| Observable Plot | ISC, free | Recommended default. Concise grammar-of-graphics API; quick bars/dots/areas for conservation-status counts, size distributions, depth ranges. Renders SVG (accessible, styleable). | Less control for highly bespoke interactions than raw D3. |
| D3.js | ISC/BSD, free | For bespoke interactive visuals — "shark vs human" size comparison, depth-zone (epipelagic→abyssopelagic) scrollytelling, custom scales/animations. | Verbose; more code; load as an island only where needed. |
| Chart.js | MIT, free | Easy canvas charts if you want the simplest API for standard chart types | Canvas (less accessible than SVG by default); less flexible than D3/Plot. |

Recommendation: Observable Plot for standard charts (fast, accessible SVG), D3 for the signature custom visuals. Both hydrate as islands so non-chart pages stay JS-free.

### Signature interactive visualizations

- Shark size vs human — D3/SVG (or even pure CSS/SVG) silhouette scaler: bind `maxLengthCm` from the species schema, draw a 1.8 m human reference, animate on `client:visible`.
- Depth-zone visualization — vertical SVG band chart mapping each species' min/max depth onto ocean zones; feed from OBIS `/statistics/env` depth bins or curated schema fields.
- Conservation status — Observable Plot bar/stacked chart of IUCN categories across the catalog.

### Search / filter UX for a large catalog

| Tool | License/Cost | Role | Notes |
|---|---|---|---|
| Pagefind | MIT, free, zero infra | Full-text site search (articles, lessons, species prose) | Static index built post-build; 10k pages searchable in <300 kB total payload; prebuilt UI web components; supports filters/facets (e.g. by family, region, IUCN status) and metadata sorting. Ideal for a static educational corpus. Source: [Pagefind](https://pagefind.app/). |
| Fuse.js | Apache-2.0, free | Instant in-page fuzzy filtering of the species catalog (typo-tolerant, weighted keys) | ~7–9 kB gzip, zero deps; load the full species index (compact JSON) and filter client-side for the explorer grid. Source: [Fuse.js](https://www.fusejs.io/). |
| Algolia / Typesense | SaaS (Algolia free tier) / Typesense (open-source, self-host or cloud) | Hosted search-as-a-service for very large/advanced search with analytics | Adds infra/cost/dependency; not needed at 500 species. Consider only if the corpus and query sophistication grow substantially. |

Recommendation: Pagefind for sitewide full-text search + faceting; Fuse.js for the instant catalog explorer filter. Skip hosted search (Algolia/Typesense) at this scale.

---

## 5. Media Handling

- Responsive images / optimization — Use Astro's built-in `<Image>` / `<Picture>` components, powered by Sharp at build time: automatic resizing, modern formats (AVIF/WebP), `srcset`, lazy loading, and CLS-preventing dimensions. Keeps everything local and free; no runtime image service required. Source: [Astro Images guide](https://docs.astro.build/en/guides/images/).
  - For very large media libraries or on-the-fly transforms, Cloudinary (free tier) or ImageKit offer a CDN pipeline — optional, adds a dependency/cost. Default to Astro+Sharp.
- Video — Short clips (anatomy loops, behavior): self-host small optimized MP4/WebM for full control and no third-party tracking/branding; for longer footage, embed YouTube/Vimeo via a lite/facade embed (e.g. `lite-youtube`) so the heavy player only loads on click — protects Core Web Vitals. Self-hosting large video gets bandwidth-expensive on a free static tier, so prefer hosted embeds for long content.
- 3D models — `<model-viewer>` (Google, Apache-2.0) renders glTF/GLB with AR, lighting, and orbit controls in a single web component — perfect for interactive shark anatomy (jaw, ampullae of Lorenzini, gill structure). Load as an island (`client:visible`); keep `.glb` files optimized (Draco compression). Drawback: 3D assets are large — lazy-load and provide a 2D fallback for low-end devices.

---

## 6. Accessibility, SEO & Performance

### Accessibility — WCAG 2.2 AA

- Astro's HTML-first output is inherently accessible; the risk areas are the interactive islands (map, charts, quiz).
- Maps: provide keyboard navigation, ARIA labels, and a text/table alternative for occurrence data (a map is not perceivable to screen-reader users — always pair with a data table or descriptive summary).
- Charts: prefer SVG (Observable Plot/D3) over canvas; add `<title>`/`<desc>`, `role="img"`, and an adjacent data table; ensure non-color encoding (don't rely on color alone for IUCN status — add labels/patterns).
- Color contrast ≥ 4.5:1 text; focus-visible styling; target size (2.2 AA: 24×24 CSS px min) for interactive controls; respect `prefers-reduced-motion` for animated visualizations.
- Test with axe-core, Lighthouse, and keyboard-only walkthroughs in CI.

### SEO — structured data (schema.org)

- Emit JSON-LD per page:
  - Species pages → `Article`/`ScholarlyArticle` + custom properties; reference the taxon. (Schema.org has no first-class "species" type; use `Article` + `about`/`mainEntity` with a Taxon-like description, plus `citation` for references.)
  - Lessons/quizzes → `LearningResource` / `Quiz` (schema.org educational types) with `educationalLevel`, `learningResourceType`.
  - Site → `WebSite` + `BreadcrumbList`; organization markup for devopsabcs-engineering.
- Citations: render `citation`/`Citation` structured data and human-readable reference lists (DOIs from GBIF downloads) — boosts credibility and scholarly SEO.
- Astro makes per-page `<head>` injection and JSON-LD trivial in layouts; add sitemap (official `@astrojs/sitemap` integration) and canonical URLs.

### Performance — Core Web Vitals

- Astro's zero-JS-by-default + islands directly targets LCP/INP/CLS: most pages are static HTML/CSS.
- Defer map/3D/quiz islands with `client:visible`/`client:idle`; pre-size all media to prevent CLS; preconnect to tile hosts; serve modern image formats.
- Static hosting on a CDN (Azure SWA / Cloudflare / Netlify) gives fast global TTFB.

---

## 7. Hosting / Deployment

| Host | Free tier highlights | CI/CD | Fit / Drawback |
|---|---|---|---|
| Azure Static Web Apps (Free) | Free hosting, free auto-renewing SSL, 2 custom domains/app, globally distributed static content, 3 staging (PR preview) environments, 100 GB bandwidth, optional managed Azure Functions (1M free executions) | Native GitHub Actions workflow auto-generated on setup; Azure DevOps also supported | Recommended — aligns with the devopsabcs-engineering Azure/GitHub posture; PR preview environments; can add serverless API later (quiz scoring, etc.). Drawback: Free tier has no SLA and hard quotas (site stops serving if exceeded). Sources: [SWA pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/static/), [SWA plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans). |
| Cloudflare Pages | Generous free tier, unlimited bandwidth, fast global edge, preview deployments | Git integration / Actions | Excellent perf & bandwidth; strong alternative if Azure constraints bite. |
| Netlify | Free tier (bandwidth/build-minute limits), instant rollbacks, deploy previews, native Decap CMS pairing | Git integration | Great DX; bandwidth/build limits on free tier; pairs naturally with Decap CMS. |
| Vercel | Free Hobby tier, deploy previews | Git integration | Best-in-class for Next.js; fine for Astro static; commercial-use restrictions on Hobby tier. |
| GitHub Pages | Free static hosting straight from repo | GitHub Actions | Simplest/free; no PR preview environments, no serverless, weaker headers/redirects control. Good fallback/minimal option. |

Recommendation: Azure Static Web Apps Free tier + GitHub Actions — org-aligned, free, SSL + custom domain, PR preview environments, and a built-in path to add serverless Functions (e.g. submit quiz scores, contact form) without re-platforming. Keep Cloudflare Pages in mind as the alternative if free-tier bandwidth/SLA limits become an issue. The build is host-agnostic (Astro static output), so switching later is low-risk.

CI/CD shape: GitHub Actions workflow → install → `astro build` (which also runs Pagefind indexing + image optimization) → deploy to Azure SWA; PRs get preview URLs automatically.

---

## 8. Recommended Concrete Stack + Sample Directory Tree

### Final stack

- Astro (static output) — framework, islands, MDX content collections
- Markdown/MDX content collections (+ Zod schemas) for species, families, lessons, citations; Decap CMS optional for non-coders
- MapLibre GL JS (+ deck.gl for dense layers) — maps; tiles from Esri World Ocean Base + MapTiler/OSM
- GBIF + OBIS APIs — occurrence data (baked to GeoJSON at build, or OBIS `.mvt` at runtime); IUCN range polygons
- Observable Plot (default charts) + D3 (bespoke size/depth visuals)
- Pagefind (full-text search/facets) + Fuse.js (instant catalog filter)
- Astro `<Image>`/Sharp (responsive images); `<model-viewer>` (glTF anatomy); lite YouTube/Vimeo embeds
- Preact (or Svelte) for lightweight interactive islands
- Azure Static Web Apps (Free) + GitHub Actions — hosting/CI
- `@astrojs/sitemap`, JSON-LD structured data, axe-core + Lighthouse CI for a11y/perf gates

### Sample project structure

```text
finfacts/
├─ .github/
│  └─ workflows/
│     └─ azure-static-web-apps.yml      # GitHub Actions → build + deploy to Azure SWA
├─ public/
│  ├─ models/                            # optimized .glb anatomy models (Draco)
│  ├─ data/
│  │  ├─ occurrences/                    # pre-baked per-species GeoJSON (from GBIF/OBIS at build)
│  │  └─ ranges/                         # simplified IUCN range polygons (GeoJSON)
│  └─ favicon.svg
├─ src/
│  ├─ content.config.ts                 # defineCollection() + Zod schemas + reference()
│  ├─ content/
│  │  ├─ species/                        # 500+ MDX entries (one per species)
│  │  │  ├─ carcharodon-carcharias.mdx
│  │  │  └─ ...
│  │  ├─ families/                       # taxonomy nodes (JSON or MD)
│  │  ├─ lessons/                        # educational long-form MDX
│  │  └─ citations/                      # reusable reference entries (JSON, DOIs)
│  ├─ components/
│  │  ├─ DistributionMap.tsx             # MapLibre + deck.gl island (client:visible)
│  │  ├─ SizeComparison.tsx              # D3 shark-vs-human island
│  │  ├─ DepthZones.tsx                  # D3/Plot depth-range visualization
│  │  ├─ ConservationChart.tsx           # Observable Plot island
│  │  ├─ SpeciesExplorer.tsx             # Fuse.js client-side filter/grid island
│  │  ├─ Quiz.tsx                        # interactive quiz island (Preact/Svelte)
│  │  └─ Citations.astro                 # renders citation refs + JSON-LD
│  ├─ layouts/
│  │  ├─ BaseLayout.astro                # head, SEO meta, JSON-LD, sitemap, a11y skip-links
│  │  └─ SpeciesLayout.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ species/
│  │  │  └─ [...id].astro                # getStaticPaths() → page per species
│  │  ├─ explore.astro                   # catalog explorer (SpeciesExplorer island)
│  │  ├─ map.astro                       # global distribution map
│  │  ├─ lessons/[...id].astro
│  │  └─ search.astro                    # Pagefind UI
│  ├─ lib/
│  │  ├─ gbif.ts                         # build-time fetch + GeoJSON bake helpers
│  │  ├─ obis.ts
│  │  └─ schema-org.ts                   # JSON-LD builders (Article/LearningResource/Quiz)
│  └─ styles/
│     └─ global.css
├─ scripts/
│  └─ fetch-occurrences.mjs              # prebuild: pull GBIF/OBIS → public/data/*.geojson
├─ public/admin/                         # (optional) Decap CMS config.yml + index.html
├─ astro.config.mjs                      # integrations: mdx, sitemap, preact, pagefind
├─ package.json
├─ tsconfig.json                         # strict (required for content collections)
└─ README.md
```

Example `content.config.ts` shape (illustrative):

```ts
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const species = defineCollection({
  loader: glob({ base: './src/content/species', pattern: '**/*.mdx' }),
  schema: z.object({
    commonName: z.string(),
    scientificName: z.string(),
    family: reference('families'),
    iucnStatus: z.enum(['LC','NT','VU','EN','CR','DD','EX','EW']),
    maxLengthCm: z.number().optional(),
    depthMinM: z.number().optional(),
    depthMaxM: z.number().optional(),
    gbifTaxonKey: z.number().optional(),     // drives build-time occurrence fetch
    obisAphiaId: z.number().optional(),
    citations: z.array(reference('citations')).default([]),
    relatedSpecies: z.array(reference('species')).default([]),
  }),
});

export const collections = { species /*, families, lessons, citations */ };
```

---

## Sources

- Astro — Islands architecture: https://docs.astro.build/en/concepts/islands/
- Astro — Content collections: https://docs.astro.build/en/guides/content-collections/
- Astro — Images guide: https://docs.astro.build/en/guides/images/
- MapLibre GL JS docs: https://maplibre.org/maplibre-gl-js/docs/
- Mapbox pricing (50k free map loads): https://www.mapbox.com/pricing
- GBIF API reference: https://techdocs.gbif.org/en/openapi/
- OBIS API v3 (incl. `.mvt` occurrence tiles): https://api.obis.org/
- Esri World Ocean Base (bathymetry basemap): https://www.arcgis.com/home/item.html?id=1e126e7520f9466c9ca28b8f28b5e500
- Pagefind (static full-text search): https://pagefind.app/
- Fuse.js (client-side fuzzy search): https://www.fusejs.io/
- Azure Static Web Apps pricing: https://azure.microsoft.com/en-us/pricing/details/app-service/static/
- Azure Static Web Apps plans/quotas: https://learn.microsoft.com/en-us/azure/static-web-apps/plans

## Recommended Next Research (not completed this session)

- [ ] IUCN Red List API — confirm current API token process, range-map data formats, and redistribution/attribution terms (range polygons have stricter terms than GBIF/OBIS).
- [ ] GBIF citation/DOI workflow — exact build-time pipeline to request occurrence downloads and capture DOIs for per-species citation rendering.
- [ ] deck.gl + MapLibre integration pattern — current recommended interop (`MapboxOverlay` / `@deck.gl/mapbox` with MapLibre) and bundle-size budget as an island.
- [ ] Astro image strategy at 500+ species scale — build-time performance of Sharp on large image sets; whether a CDN (Cloudinary/ImageKit free tier) is warranted.
- [ ] Decap CMS current maintenance status vs alternatives (e.g. Sveltia CMS, Pages CMS) for git-based editing in 2025/2026.
- [ ] Quiz scoring — whether to keep quizzes purely client-side or add an Azure Functions endpoint (SWA managed API) for tracking/leaderboards.
- [ ] Accessibility of MapLibre/deck.gl — concrete keyboard + screen-reader patterns and the paired data-table approach.

## Clarifying Questions

1. Will quizzes need user accounts / score persistence / progress tracking? If yes, this pushes toward an Azure Functions (SWA managed API) backend or a lightweight auth provider — otherwise everything stays static.
2. Who edits content — only developers (git/MDX is fine) or also non-technical marine biologists (justifies Decap CMS or a headless SaaS)?
3. Expected traffic volume? Determines whether the Azure SWA Free tier (100 GB bandwidth, no SLA) suffices or whether Standard / Cloudflare Pages is warranted.
4. Are paid data licenses acceptable (e.g. IUCN spatial data terms, Mapbox) or must everything be free/open-source? (Current recommendation assumes free/open-source preference.)
5. Is offline/PWA support desired for field/classroom use without connectivity?
