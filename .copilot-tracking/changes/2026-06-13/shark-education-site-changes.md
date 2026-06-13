<!-- markdownlint-disable-file -->
# Release Changes: Shark Education Website (FinFacts)

**Related Plan**: shark-education-site-plan.instructions.md
**Implementation Date**: 2026-06-13

## Summary

Build a scientifically rigorous, engaging Astro static site covering extant shark species for marine biology undergraduates and serious high-school students, with first-class Scuba and Filmmaking pathways, grounded in open scientific data APIs with per-fact citations, deployed to Azure Static Web Apps via GitHub Actions.

## Changes

### Added

* package.json - Astro 5.x project manifest with mdx/sitemap/preact/pagefind deps and guarded prebuild script (Phase 1)
* astro.config.mjs - Static output config, site URL placeholder, 4 integrations registered (Phase 1)
* tsconfig.json - Extends astro/tsconfigs/strict (Phase 1)
* .gitignore - node_modules, dist, .astro, .env (Phase 1)
* public/favicon.svg - Placeholder shark-fin favicon (Phase 1)
* src/styles/global.css - Accessible base styles: contrast tokens, focus-visible, skip-link, reduced-motion (Phase 1)
* src/lib/schema-org.ts - Typed JSON-LD builders for LearningResource/Article (Phase 1)
* src/pages/index.astro - Minimal placeholder page (replaced in Phase 5) (Phase 1)
* scripts/.gitkeep, public/data/.gitkeep, public/models/.gitkeep, src/content/.gitkeep, src/components/.gitkeep, src/layouts/.gitkeep - Directory placeholders (Phase 1)
* src/content.config.ts - Four collections (species, families, lessons, citations) with Zod schemas, sourcedValue() helper, externalIds, record/review metadata, diving/filming overlays, cross-collection reference() links (Phase 2)
* src/lib/citations.ts - CSE name-year (and optional APA) citation formatting, DOI normalization, resolveCitations() (Phase 2)
* src/content/species/.gitkeep, src/content/families/.gitkeep, src/content/lessons/.gitkeep, src/content/citations/.gitkeep - Collection directory placeholders (Phase 2)
* scripts/fetch-occurrences.mjs - Offline-safe prebuild orchestrator: species discovery, GBIF+OBIS occurrence baking, IUCN/OBIS-redlist assessment, inline Douglas-Peucker simplification, GeoJSON output (Phase 3)
* src/lib/gbif.ts - GBIF helpers: matchSpecies, capped searchOccurrences, async requestDownload/pollDownload DOI flow (Phase 3)
* src/lib/obis.ts - OBIS occurrencePoints + .mvt tileUrl helpers (Phase 3)
* src/lib/iucn.ts - IUCN v4 bearer client (redListVersion, assessmentByTaxon) + OBIS redlist fallback, sourced-value-shaped assessment output (Phase 3)
* src/content/species/*.mdx - 8 flagship species (one per living shark order) with full per-fact citations, externalIds, conservation, diving/filming overlays, review badges (Phase 6)
* src/content/families/*.json - 8 family taxonomy nodes (Lamnidae, Rhincodontidae, Galeocerdonidae, Hexanchidae, Somniosidae, Squatinidae, Pristiophoridae, Heterodontidae) (Phase 6)
* src/content/lessons/*.mdx - Biology fundamentals, taxonomy-evolution, ecology-conservation, glossary, scuba/filming pathways, careers (Phase 6)
* src/content/citations/*.json - 16 reusable references incl. anchor DOIs (Pacoureau 2021, Dulvy 2021/2014, Compagno 1984) (Phase 6)
* src/components/types.ts - Shared island types: IUCN label/style (symbol+color), risk ordering, summary shapes (Phase 4)
* src/components/DistributionMap.tsx - MapLibre + deck.gl occurrence/range island, dynamically imported (Phase 4)
* src/components/MapDataTable.tsx - Accessible paired occurrence/range table (Phase 4)
* src/components/SpeciesExplorer.tsx - Fuse.js fuzzy filter/grid island (Phase 4)
* src/components/ConservationChart.tsx - Observable Plot IUCN dashboard, label+icon paired (Phase 4)
* src/components/SizeComparison.tsx - D3 shark-vs-diver size visualizer (Phase 4)
* src/components/DepthZones.tsx - D3 depth-range visualizer (Phase 4)
* src/components/Quiz.tsx - Leitner spaced-repetition quiz, localStorage, aria-live (Phase 4)
* src/components/IdentificationKey.tsx - Dichotomous ID-key state machine with text fallback + DR-04 editorial TODO (Phase 4)
* src/components/DivePlanner.tsx - "Build a dive plan" island from diving overlay (Phase 4)
* src/components/ShootPlanner.tsx - "Plan a shoot" island from filming overlay (Phase 4)
* src/components/RiskExplainer.tsx - ISAF risk explainer + DR-07 editorial TODO (Phase 4)
* src/components/CitizenScienceHub.tsx - Contribution hub + DR-07 link-verification TODO (Phase 4)
* src/layouts/BaseLayout.astro - Head/SEO meta, canonical, OG/Twitter, JSON-LD, skip-link, semantic landmarks, IA nav (Phase 5)
* src/layouts/SpeciesLayout.astro - Per-species layout: review badge, content dating, citations region (Phase 5)
* src/components/Citations.astro - Citation reference rendering + JSON-LD emission (Phase 5)
* src/lib/species-view.ts - Species view-model derivation for page props (Phase 5)
* src/pages/species/[...id].astro - 8 per-species pages via getStaticPaths with map/size/depth/planner islands (Phase 5)
* src/pages/lessons/[...id].astro, src/pages/lessons/index.astro - 7 lesson pages + index with Quiz island (Phase 5)
* src/pages/explore.astro - Catalog explorer (SpeciesExplorer island) (Phase 5)
* src/pages/map.astro - Global distribution map (DistributionMap + MapDataTable) (Phase 5)
* src/pages/search.astro - Pagefind search UI (Phase 5)
* src/pages/pathways/scuba.astro, src/pages/pathways/filming.astro - Dual-track pathway pages with planners (Phase 5)
* src/pages/careers.astro - Careers & Get Involved + CitizenScienceHub (Phase 5)
* src/pages/toolkit.astro - Toolkit hub: glossary, ID key, conservation chart, methods (Phase 5)
* .github/workflows/azure-static-web-apps.yml - Azure SWA deploy workflow with PR previews + close-cleanup (Phase 7)
* .github/workflows/quality.yml - Accessibility (axe-core) + Lighthouse CI gate workflow, no secrets (Phase 7)
* staticwebapp.config.json - Routes, MIME, caching, SPA fallback, WebGL-safe security headers/CSP (Phase 7)
* lighthouserc.json - Lighthouse CI config: 5 routes, a11y/SEO error thresholds, map byte-budget warnings (Phase 7)
* scripts/a11y-check.mjs - Self-contained Playwright + axe-core WCAG 2.2 AA harness (Phase 7)

### Modified

* src/pages/index.astro - Replaced Phase-1 placeholder with Home/onboarding + audience selector + ISAF hero + RiskExplainer island (Phase 5)
* src/styles/global.css - Added ~350 lines: header/nav/footer/prose/badges/hero styles (Phase 5)
* src/components/DistributionMap.tsx - Fixed deck.gl prop `radiusunits` → `radiusUnits` (Phase 5)
* tsconfig.json - Preact JSX settings: jsx react-jsx, jsxImportSource preact (Phase 4)
* scripts/fetch-occurrences.mjs - Added SKIP_DATA_FETCH short-circuit for fast CI quality builds (Phase 7)
* package.json - Added lint:a11y/lint:lhci scripts + @axe-core/playwright, @lhci/cli, playwright devDeps (Phase 7)
* src/lib/schema-org.ts - Added buildWebSite JSON-LD helper (Phase 7)
* src/pages/index.astro - Wired homepage WebSite JSON-LD node (Phase 7)

### Removed

* build.log - Transient build-verification artifact (Phase 5)

## Additional or Deviating Changes

* Phase 1: `prebuild` script wired as a cross-platform no-op guard (existence check via `node -e`) so `npm run build` succeeds before the Phase 3 data script exists
  * Reason: Avoids breaking the build during early phases; the guard auto-activates once `scripts/fetch-occurrences.mjs` lands in Phase 3
* Phase 1: `npm install` reported 5 transitive-dependency advisories (1 low, 4 high); not auto-fixed to avoid breaking pinned integration versions
  * Reason: Advisory-only, did not block build; triage deferred (see Planning Log follow-on)
* Phase 4: tsconfig.json modified to add `jsx: "react-jsx"` + `jsxImportSource: "preact"` for island TSX typing
  * Reason: Required for Preact JSX compilation of island components
* Phase 4: maplibre-gl lazy chunk ~285 KB gzipped exceeds the DR-06 ~250 KB map-island budget (correctly lazy-loaded, only downloads on map mount)
  * Reason: Flagged for Phase 5/7 perf review; lazy isolation keeps non-map pages at ~zero JS
* Phase 4: DistributionMap uses `radiusunits` (should be deck.gl `radiusUnits`); type-stripping hid it, runtime no-op until fixed in Phase 5 hydration
  * Reason: Noted for Phase 5 hydration verification
* Phase 4: IdentificationKey/RiskExplainer/CitizenScienceHub ship clearly-marked SAMPLE datasets with editorial TODOs (DR-04/DR-07/WI-08) pending authoritative source gathering
  * Reason: Avoids fabricating authoritative taxonomic couplets/risk figures; mechanism complete, data flagged for replacement

## Release Summary

All 7 implementation phases plus Phase N validation are complete. The FinFacts shark-education site is a fully building Astro 5.x static site.

**Build status**: `npm run build` exits 0, generating **24 static pages** (8 species + 7 lessons + 9 IA pages), a Pagefind search index, and a sitemap. Fast CI builds via `SKIP_DATA_FETCH=1` complete in ~10s.

**Files created/modified by area**:
* Scaffold & config: package.json, package-lock.json, astro.config.mjs, tsconfig.json, .gitignore, public/favicon.svg
* Content model: src/content.config.ts (sourced-value schema), src/lib/citations.ts, src/lib/schema-org.ts, src/lib/species-view.ts
* Data pipeline: scripts/fetch-occurrences.mjs (offline-safe, SKIP_DATA_FETCH), src/lib/gbif.ts, src/lib/obis.ts, src/lib/iucn.ts → bakes public/data/occurrences + ranges GeoJSON
* Islands (12 Preact .tsx + types.ts): DistributionMap, MapDataTable, SpeciesExplorer, ConservationChart, SizeComparison, DepthZones, Quiz, IdentificationKey, DivePlanner, ShootPlanner, RiskExplainer, CitizenScienceHub
* Layouts & pages: BaseLayout.astro, SpeciesLayout.astro, Citations.astro; index, species/[...id], lessons/[...id], lessons/index, explore, map, search, pathways/scuba, pathways/filming, careers, toolkit
* Content seed: 8 species MDX, 8 family nodes, 7 lessons (incl. glossary, pathways, careers), 16 citations (anchor DOIs: Pacoureau 2021, Dulvy 2021/2014, Compagno 1984)
* CI/CD & gates: .github/workflows/azure-static-web-apps.yml, .github/workflows/quality.yml, staticwebapp.config.json, lighthouserc.json, scripts/a11y-check.mjs
* Styles: src/styles/global.css (accessible tokens, focus-visible, reduced-motion, ~350 lines of layout/prose/badge/hero styles)

**Dependency & infrastructure changes**: Added runtime deps (maplibre-gl, deck.gl, fuse.js, @observablehq/plot, d3) and devDeps (@axe-core/playwright, @lhci/cli, playwright). Heavy map/chart libs are dynamically imported so non-interactive pages ship ~zero JS.

**Deployment notes**:
* Set the GitHub repo secret `AZURE_STATIC_WEB_APPS_API_TOKEN` (provision the Azure Static Web App first). `GITHUB_TOKEN` is automatic; `IUCN_API_TOKEN` is optional (script degrades to OBIS redlist fallback).
* Replace the placeholder `site: https://finfacts.example.com` in astro.config.mjs with the real production domain before go-live (drives canonical/sitemap/JSON-LD URLs).
* axe-core + Lighthouse CI gates run on PRs (fast, SKIP_DATA_FETCH); the deploy workflow runs the full network data fetch (timeout 20m).

**Deferred / follow-on (tracked in Planning Log)**: WI-08 pathway-source gathering, WI-09 npm-audit triage (5 advisories), WI-10 map-bundle perf budget (~285 KB gzipped lazy chunk), WI-11 replace island SAMPLE datasets (ID-key couplets, ISAF odds, citizen-science links) with authoritative sources. Decision-point defaults (PD-01..PD-07) applied; confirm to override.
