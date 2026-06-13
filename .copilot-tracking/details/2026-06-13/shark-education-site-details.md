<!-- markdownlint-disable-file -->
# Implementation Details: Shark Education Website (FinFacts)

## Context Reference

Sources: .copilot-tracking/research/2026-06-13/shark-education-site-research.md; .copilot-tracking/research/subagents/2026-06-13/web-tech-stack-research.md; .copilot-tracking/research/subagents/2026-06-13/shark-data-sources-research.md; .copilot-tracking/research/subagents/2026-06-13/content-pedagogy-research.md

## Implementation Phase 1: Project Scaffold and Build Tooling

<!-- parallelizable: false -->

### Step 1.1: Initialize Astro project with static output and core integrations

Create the Astro project at the workspace root (greenfield) with static `output`, MDX content collections, sitemap, Preact for islands, and Pagefind for search. Use the directory tree from the research Scenario A.

Files:
* package.json - Add Astro and integration dependencies; scripts for `dev`, `build`, `preview`, `prebuild` (data fetch)
* astro.config.mjs - Register integrations: mdx, sitemap, preact, pagefind; set `output: 'static'`, `site` URL
* tsconfig.json - Strict TypeScript config extending astro/tsconfigs/strict
* public/favicon.svg - Placeholder favicon

Discrepancy references:
* Addresses DR-01 (scope default) by structuring content/species to hold all extant sharks with optional chondrichthyan expansion

Success criteria:
* `npm install` resolves cleanly
* `npm run build` emits static HTML to `dist/`

Context references:
* web-tech-stack-research.md - Recommended stack and sample directory tree
* shark-education-site-research.md (§Scenario A) - Project tree and integration list

Dependencies:
* Node.js 20+ and npm available

### Step 1.2: Configure astro.config.mjs, package.json scripts, base styles, and project tree

Establish the full source tree (`src/content`, `src/components`, `src/layouts`, `src/pages`, `src/lib`, `src/styles`, `scripts/`, `public/data`, `public/models`) and global stylesheet with accessible defaults (focus styles, contrast tokens, `prefers-reduced-motion`).

Files:
* src/styles/global.css - Base styles, color tokens with ≥4.5:1 contrast, reduced-motion handling
* scripts/.gitkeep, public/data/.gitkeep, public/models/.gitkeep - Establish directories
* src/lib/schema-org.ts - JSON-LD builders (LearningResource/Article) stub

Success criteria:
* Directory tree matches the research Scenario A layout
* `npm run build` succeeds with empty content collections

Context references:
* shark-education-site-research.md (§Scenario A) - Directory tree
* content-pedagogy-research.md - Accessibility (WCAG 2.2 AA) defaults

Dependencies:
* Step 1.1 completion

## Implementation Phase 2: Content Model and Schemas

<!-- parallelizable: false -->

### Step 2.1: Define content.config.ts collections and Zod schemas (species, families, lessons, citations)

Create `src/content.config.ts` defining four collections with Zod schemas and cross-collection `reference()` links, mirroring the research per-species schema. Required species fields: identity, externalIds, taxonomy, conservation.iucn.

Files:
* src/content.config.ts - defineCollection() for species, families, lessons, citations; Zod schemas; reference() links
* src/content/species/.gitkeep - Species MDX directory
* src/content/families/.gitkeep - Taxonomy node directory
* src/content/lessons/.gitkeep - Long-form lesson MDX directory
* src/content/citations/.gitkeep - Reusable citation JSON directory

Discrepancy references:
* Addresses DD-01 (schema fidelity) by encoding the full sourced-value pattern, not the abbreviated Zod sample

Success criteria:
* Schema compiles and validates at build time
* species collection references families and citations collections

Context references:
* shark-education-site-research.md (§Complete Examples) - content.config.ts Zod sample and per-species JSON schema
* content-pedagogy-research.md - Full per-species schema draft

Dependencies:
* Step 1.1 completion

### Step 2.2: Encode sourced-value object pattern, external authority IDs, and record/review metadata

Model every non-trivial factual field as a sourced-value object `{ value, unit?, sources, confidence?, asOf }`; add a central `citations[]` with full references (DOIs/URLs/accessedDate/license); include externalIds (AphiaID, Eschmeyer CoF, FishBase SpecCode, IUCN taxonId, GBIF key, iNaturalist taxonId, ITIS TSN) and record metadata (created/lastUpdated/lastReviewed/reviewedBy/taxonomicAuthorityVersion).

Files:
* src/content.config.ts - Sourced-value Zod helper, externalIds object, record/review metadata, diving and filming sub-objects
* src/lib/citations.ts - Citation resolution/formatting helpers (CSE name-year; optional APA)

Discrepancy references:
* Addresses DD-01 (schema fidelity)

Success criteria:
* Factual fields are sourced-value objects, not bare scalars
* externalIds includes AphiaID as the primary join key
* CSE citation rendering produces dated, DOI-linked references

Context references:
* shark-education-site-research.md (§Implementation Patterns; §Complete Examples) - Sourced-value pattern, externalIds, citations
* content-pedagogy-research.md - CSE name-year citation style

Dependencies:
* Step 2.1 completion

## Implementation Phase 3: Build-Time Data Ingestion Pipeline

<!-- parallelizable: true -->

### Step 3.1: Implement scripts/fetch-occurrences.mjs for GBIF + OBIS occurrences

Build a prebuild Node script that, for each species' externalIds, fetches GBIF occurrences (via async download request → citation DOI) and OBIS occurrence points, simplifies to GeoJSON, and writes per-species files to `public/data/occurrences/`. Respect no-auth reads; use Basic Auth only for GBIF downloads.

Files:
* scripts/fetch-occurrences.mjs - GBIF + OBIS fetch, GeoJSON simplification, per-species output
* src/lib/gbif.ts - GBIF species/match and occurrence/download helpers
* src/lib/obis.ts - OBIS occurrence/points and tile helpers

Discrepancy references:
* Addresses DD-02 (data ingestion mode) — hybrid: programmatic baking + curated launch set

Success criteria:
* Per-species GeoJSON written to `public/data/occurrences/`
* GBIF download DOI captured for per-species citation
* Runtime site has no live API dependency for occurrences

Context references:
* shark-data-sources-research.md (§GBIF, §OBIS) - Endpoints, async download, .mvt tiles
* shark-education-site-research.md (§API and Schema Documentation) - GBIF/OBIS endpoints

Dependencies:
* Step 2.2 completion (externalIds drive the queries)

### Step 3.2: Fetch and simplify IUCN range polygons (or no-token OBIS redlist fallback) to GeoJSON

Fetch IUCN Red List v4 assessment metadata and range polygons (token-gated, non-commercial) when available; otherwise fall back to OBIS `/checklist/redlist` for IUCN categories. Simplify range polygons and write to `public/data/ranges/`. Refresh per Red List version via `/information/red_list_version`.

Files:
* scripts/fetch-occurrences.mjs - Extend with IUCN range + assessment fetch and OBIS fallback
* src/lib/iucn.ts - IUCN v4 token bearer client, version check, assessment fetch

Discrepancy references:
* Addresses DR-02 (commercial-use confirmation) — defaults to non-commercial IUCN API with OBIS fallback

Success criteria:
* Simplified range polygons in `public/data/ranges/`
* OBIS fallback path verified when no IUCN token is present
* IUCN assessment metadata stored as a sourced-value object (criteria/trend/year/URL), never a bare label

Context references:
* shark-data-sources-research.md (§IUCN Red List v4) - Token, non-commercial terms, version endpoint
* shark-education-site-research.md (§Scenario C) - IUCN vs OBIS fallback vs IBAT

Dependencies:
* Step 3.1 completion

## Implementation Phase 4: Interactive Island Components

<!-- parallelizable: true -->

### Step 4.1: Build DistributionMap (MapLibre + deck.gl) with paired data-table alternative

Implement a MapLibre GL JS base map (BSD-3, no key) with deck.gl overlay for dense occurrence points and IUCN range polygons, consuming pre-baked GeoJSON or OBIS `.mvt` tiles. Use Esri World Ocean Base under occurrence layers with attribution. Hydrate via `client:visible`. Pair with an accessible data-table/text summary.

Files:
* src/components/DistributionMap.tsx - MapLibre + deck.gl island
* src/components/MapDataTable.tsx - Paired accessible occurrence/range table

Discrepancy references:
* Addresses DD-03 (mapping engine) — MapLibre + deck.gl over Mapbox/Leaflet

Success criteria:
* Renders 100k+ points without per-load billing
* Keyboard navigation, ARIA labels, and paired data table present
* Basemap attribution displayed ("not for navigation")

Context references:
* shark-education-site-research.md (§Scenario B) - MapLibre + deck.gl, basemaps, paired-data-table pattern
* web-tech-stack-research.md - Mapping stack and bundle budget

Dependencies:
* Step 3.2 completion (consumes baked GeoJSON)

### Step 4.2: Build SpeciesExplorer (Fuse.js), ConservationChart (Observable Plot), SizeComparison/DepthZones (D3), Quiz

Implement the remaining islands: client-side filter/grid explorer (Fuse.js) with order/family, IUCN status, ocean basin, depth, size, "divers encounter," "frequently filmed" filters; conservation dashboard (Observable Plot); size-vs-diver and depth-zone visualizers (D3); interactive quiz with spaced-repetition scheduling (client-only, no accounts by default).

Files:
* src/components/SpeciesExplorer.tsx - Fuse.js filter/grid island
* src/components/ConservationChart.tsx - Observable Plot island
* src/components/SizeComparison.tsx - D3 shark-vs-human island
* src/components/DepthZones.tsx - D3/Plot depth-range island
* src/components/Quiz.tsx - Interactive quiz island with retrieval/spacing scheduling

Discrepancy references:
* Addresses DR-03 (quiz persistence) — fully static client-side default; Azure Functions deferred (WI-02)

Success criteria:
* Explorer filters operate on a pre-built client index
* Conservation chart pairs colors with labels/icons (no color-only status)
* Quiz schedules review without server persistence

Context references:
* shark-education-site-research.md (§Engaging Interactive Features) - Feature/data-source table
* content-pedagogy-research.md - Spaced repetition, retrieval practice, UDL 3.0

Dependencies:
* Step 2.2 completion (schema fields power filters/visuals)

## Implementation Phase 5: Layouts, Pages and Information Architecture

<!-- parallelizable: false -->

### Step 5.1: Build BaseLayout/SpeciesLayout with SEO meta, JSON-LD, and a11y skip-links

Create shared layouts with head/SEO meta, JSON-LD (`LearningResource`/`Article`), skip-links, semantic landmarks, and the "Reviewed by … on …" expert badge plus content-dating display.

Files:
* src/layouts/BaseLayout.astro - Head, SEO meta, skip-links, semantic landmarks
* src/layouts/SpeciesLayout.astro - Per-species layout with review badge, dating, citations region
* src/components/Citations.astro - Renders citation refs + JSON-LD

Success criteria:
* Pages emit valid JSON-LD and sitemap-eligible metadata
* Expert-review badge and content dates render from schema fields

Context references:
* content-pedagogy-research.md - reviewedBy/lastReviewed badges, content dating, confidence tags
* shark-education-site-research.md (§Configuration Examples) - JSON-LD and SEO shape

Dependencies:
* Step 2.2 completion

### Step 5.2: Build dynamic routes and IA pages (species, explore, map, lessons, search, pathways)

Implement the dual-track IA: Home/onboarding with audience selector and ISAF myth-busting hero; Species Explorer; Biology Fundamentals; Taxonomy & Evolution; Ecology & Conservation; Scuba pathway; Filmmaking pathway; Careers; Toolkit. Use `getStaticPaths()` for per-species and per-lesson pages. Cross-link every concept page to exemplar species and every species page to related biology / diving / filming.

Files:
* src/pages/index.astro - Home/onboarding with audience selector
* src/pages/species/[...id].astro - Per-species pages via getStaticPaths
* src/pages/explore.astro - Catalog explorer (SpeciesExplorer island)
* src/pages/map.astro - Global distribution map (DistributionMap island)
* src/pages/lessons/[...id].astro - Lesson pages
* src/pages/search.astro - Pagefind UI
* src/pages/pathways/scuba.astro - Scuba diving pathway
* src/pages/pathways/filming.astro - Underwater filmmaking pathway

Discrepancy references:
* Addresses DR-01 (scope) — species routes cover extant sharks with chondrichthyan expansion ready

Success criteria:
* One page generated per species and per lesson
* Pathway pages re-surface biology/species through applied lenses
* Cross-links between concept, species, diving, and filming present

Context references:
* shark-education-site-research.md (§Recommended Information Architecture) - Section list and navigation principle
* content-pedagogy-research.md - Dual-track IA with pathway overlays

Dependencies:
* Step 4.1, Step 4.2 completion (pages embed islands)
* Step 5.1 completion (layouts)

## Implementation Phase 6: Launch Content Seed Set

<!-- parallelizable: true -->

### Step 6.1: Author flagship species entries (one per living order) with full per-fact citations

Author MDX/JSON species entries for one flagship species per living shark order, each with full identity, externalIds, taxonomy, morphology, distribution, conservation.iucn, diving and filming sub-objects, complete `citations[]` (DOIs/URLs/accessedDate), and an expert-review badge.

Files:
* src/content/species/*.mdx - Flagship species per order (e.g., great white, whale shark, tiger shark, etc.)
* src/content/citations/*.json - Reusable reference entries with DOIs

Discrepancy references:
* Addresses DD-02 (data ingestion mode) — curated launch set with per-fact citations

Success criteria:
* Each entry validates against the Zod schema
* Every non-trivial fact carries at least one citation reference
* Anchor references (Pacoureau 2021, Dulvy 2021/2014, Compagno 1984) available in citations

Context references:
* shark-data-sources-research.md - Species counts, 8 orders, anchor references with DOIs
* content-pedagogy-research.md - Per-species schema, confidence/evidence tags

Dependencies:
* Step 2.2 completion

### Step 6.2: Author foundational lessons, glossary, family nodes, and pathway overview content

Author Biology Fundamentals and Taxonomy & Evolution lessons, the glossary with pronunciation, family taxonomy nodes, and the Scuba/Filmmaking pathway overview content, applying the refutation-text pattern for misconception correction and tiered depth (concise core + "Going deeper").

Files:
* src/content/lessons/*.mdx - Biology, taxonomy, ecology/conservation lessons
* src/content/families/*.mdx - Family taxonomy nodes
* src/content/lessons/glossary.mdx - Glossary + pronunciation
* src/content/lessons/pathway-scuba.mdx, src/content/lessons/pathway-filming.mdx - Pathway overviews

Success criteria:
* Lessons end with a low-stakes interactive (active learning)
* Misconception correction uses refutation-text + ISAF framing without fear-mongering imagery
* Tiered depth present (core + expandable college-level)

Context references:
* content-pedagogy-research.md - Active learning, UDL 3.0, refutation-text, tiered depth
* shark-education-site-research.md (§Pedagogy & Credibility) - Evidence-grounded patterns

Dependencies:
* Step 2.2 completion

## Implementation Phase 7: CI/CD, Accessibility and SEO Gates

<!-- parallelizable: false -->

### Step 7.1: Add Azure Static Web Apps + GitHub Actions workflow with PR previews

Create the GitHub Actions workflow deploying to Azure Static Web Apps Free tier, running `npm ci` → `npm run build` (Pagefind index + Sharp images) → deploy, with PR preview environments and close-cleanup.

Files:
* .github/workflows/azure-static-web-apps.yml - Build + deploy workflow with PR previews
* staticwebapp.config.json - Routes, headers, fallback, MIME config

Success criteria:
* Workflow builds and deploys static output
* PR opens create preview environments; PR close cleans them up
* Deployment token referenced as a secret (filled at setup)

Context references:
* shark-education-site-research.md (§Configuration Examples; §Scenario D) - Workflow shape, Azure SWA Free tier
* web-tech-stack-research.md - Hosting/CI recommendation

Dependencies:
* Phase 1-6 completion (deployable site)

### Step 7.2: Wire accessibility (axe-core) and Lighthouse CI gates, sitemap, and JSON-LD

Add automated accessibility (axe-core) and performance/SEO (Lighthouse CI) checks to the workflow; verify sitemap generation and JSON-LD output; confirm paired data-table alternatives for every map/chart island and label/icon pairing for IUCN status.

Files:
* .github/workflows/azure-static-web-apps.yml - Add axe-core and Lighthouse CI steps
* lighthouserc.json - Lighthouse CI assertions (Core Web Vitals, a11y, SEO)

Success criteria:
* axe-core passes WCAG 2.2 AA on key pages
* Lighthouse CI thresholds met (performance, a11y, SEO)
* Sitemap and JSON-LD validated; no color-only status indicators

Context references:
* content-pedagogy-research.md - WCAG 2.2 AA requirements
* shark-education-site-research.md (§Recommended Next Steps step 8) - a11y + SEO gates

Dependencies:
* Step 7.1 completion

## Implementation Phase N: Validation

<!-- parallelizable: false -->

### Step N.1: Run full project validation

Execute all validation commands:
* `npm run build`
* `npm run lint` (if configured)
* axe-core accessibility run
* Lighthouse CI run

### Step N.2: Fix minor validation issues

Iterate on lint errors, build warnings, broken citation references, unresolved schema references, and accessibility findings. Apply fixes directly when corrections are straightforward and isolated.

### Step N.3: Report blocking issues

When validation failures require changes beyond minor fixes:
* Document the issues and affected files.
* Provide the user with next steps.
* Recommend additional research and planning (e.g., licensing confirmation, OCEARCH telemetry terms) rather than inline fixes.
* Avoid large-scale refactoring within this phase.

## Dependencies

* Node.js 20+ and npm
* Astro and integrations (mdx, sitemap, preact, pagefind)
* MapLibre GL JS, deck.gl, Observable Plot, D3, Fuse.js, Pagefind, Sharp
* Azure Static Web Apps Free tier + GitHub Actions deployment token
* Open data API access (WoRMS/OBIS/GBIF reads; optional IUCN/CITES tokens)

## Success Criteria

* Static Astro site builds with islands hydrating only interactive widgets
* Zod-validated per-fact sourced-value schema with external authority IDs enforced
* Build-time GeoJSON pipeline removes runtime API dependency
* All islands function with accessible paired alternatives
* Dual-track IA with Scuba and Filmmaking pathways navigable and cross-linked
* Launch seed set carries full citations and review badges
* Azure SWA + GitHub Actions deploys with PR previews
* WCAG 2.2 AA gates pass
