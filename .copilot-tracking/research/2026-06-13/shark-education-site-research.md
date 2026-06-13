<!-- markdownlint-disable-file -->
# Task Research: Shark Education Website for College-Level Enthusiasts (FinFacts)

Build an engaging, scientifically rigorous educational website covering all extant shark species on Earth. Primary audience: first-year marine biology undergraduates and serious high-school students considering marine biology. Notable sub-audiences: learners training in scuba diving, and learners interested in filming underwater sharks in their natural habitat. The site must combine genuine engagement with defensible, citable scientific value.

## Task Implementation Requests

* Educational website covering all species of sharks on the planet
* Audience: first-year marine biology undergrads + serious high school students
* Sub-interests served as first-class pathways: scuba diving, underwater shark filming/cinematography
* Engaging UX paired with real scientific rigor and authoritative sourcing

## Scope and Success Criteria

* Scope: technical architecture/stack, authoritative scientific data sources/APIs, content model + per-species schema, information architecture, engaging interactive features, evidence-based pedagogy, sourcing/citation practices, accessibility, hosting/CI. Excludes: final visual brand identity, production cloud account provisioning, writing all 500+ species records (curation is an ongoing content task, not a research deliverable).
* Assumptions:
  * Workspace `finfacts` is greenfield (only `README.md` present) — full build from scratch.
  * Repo lives under the `devopsabcs-engineering` GitHub org → Azure + GitHub Actions are natural fits.
  * Preference for free / open-source tooling and free hosting tiers unless the user states otherwise.
  * "All sharks" defaults to extant sharks (Selachimorpha, ~500+ species), with optional expansion to all chondrichthyans (sharks + rays/batoids + chimaeras, ~1,300+).
* Success Criteria:
  * Authoritative shark data sources and APIs identified with auth, endpoints, formats, licensing. ✅
  * Recommended technical stack/architecture selected with rationale. ✅
  * Content model, information architecture, and per-species schema defined for the target audience. ✅
  * Evidence-based pedagogy and engagement features defined. ✅
  * Scientific citation/credibility approach defined. ✅
  * Actionable next steps for implementation. ✅

## Outline

1. Selected approach: Astro static/JAMstack site, git-based MDX content collections, schema-as-source-of-truth, free/open data APIs baked at build time, deployed to Azure Static Web Apps via GitHub Actions.
2. Authoritative data sources (taxonomy, conservation, occurrence/range, media) with auth and licensing.
3. Information architecture: dual-track (Learn + Reference) with Scuba and Filmmaking pathway overlays.
4. Per-species schema with per-fact sourced-value objects and external authority IDs.
5. Engaging interactive features grounded in real data and pedagogy.
6. Evidence-based pedagogy (active learning, UDL 3.0, spaced repetition, responsible misconception correction).
7. Scientific credibility practices (CSE citations, per-fact sourcing, expert review, dating, confidence tags).
8. Accessibility (WCAG 2.2 AA) and inclusivity.
9. Technical scenarios (alternatives evaluated) and the recommended stack with a sample project tree.
10. Critical licensing decision points and open questions.

## Potential Next Research

* IUCN Red List API v4 token request flow + a sample authenticated request/response payload, and confirmation of commercial vs non-commercial use terms for `finfacts`.
  * Reasoning: IUCN Red List API is **non-commercial only**; this is the single biggest licensing constraint and changes the conservation-data architecture if the site is deemed commercial (would require IBAT licensing instead).
  * Reference: .copilot-tracking/research/subagents/2026-06-13/shark-data-sources-research.md §2
* Live WoRMS / shark-references "List of Valid Extant Species" query for the current authoritative extant shark count + family breakdown.
  * Reasoning: Replace the secondary Wikipedia figure (557 described + 23 undescribed) with a primary, datable authority count to size the database and ID-key couplets.
  * Reference: shark-data-sources §1; content-pedagogy §"Authoritative Sources"
* GBIF occurrence download/DOI pipeline for per-species citations baked at build time, plus deck.gl + MapLibre interop pattern and island bundle-size budget.
  * Reasoning: Per-species citation DOIs require the GBIF async download API, not the search API; the map island must stay within a performance budget.
  * Reference: web-tech-stack §3, §"Recommended Next Research"
* OCEARCH / Global Shark Movement Project telemetry data access and terms for the migration/tracking map feature.
  * Reasoning: Tracking data was in scope but not yet investigated; terms govern whether tracks can be embedded.
  * Reference: shark-data-sources §3 follow-ons
* Survey of exemplar sites (Florida Museum "Discover Fishes," Shark Trust, MarineBio, Save Our Seas) for IA differentiation; concrete dichotomous-key source (FAO catalogues / elasmo-key.org) for the ID-key couplets; verifiable filmmaking gear/ethics references and named cinematographers; diving safety/ethics codes (Green Fins-style).
  * Reasoning: Needed to author the Scuba and Filmmaking pathway content credibly and differentiate from existing sites.
  * Reference: content-pedagogy §"Recommended Next Research"
* FishBase / SeaLifeBase (`rfishbase` / Bohol Base API) and Eschmeyer's Catalog of Fishes programmatic access + license for traits/common names/nomenclature.
  * Reasoning: Enriches morphology/ecology fields and validates nomenclature; access terms not yet confirmed.
  * Reference: shark-data-sources §1 follow-ons

## Research Executed

### File Analysis

* c:\src\GitHub\devopsabcs-engineering\finfacts\README.md
  * Workspace is effectively empty (greenfield); no existing stack or conventions to preserve. Full build from scratch is appropriate.

### Subagent Research Documents

* .copilot-tracking/research/subagents/2026-06-13/shark-data-sources-research.md
  * Authoritative APIs/sources: WoRMS (taxonomy backbone, AphiaID join key, no auth), OBIS + GBIF (occurrences), IUCN Red List v4 (conservation, token, non-commercial), CITES Species+ (trade, token), Wikimedia Commons / iNaturalist / EOL / NOAA (media). Species count ~557 described + 23 undescribed across 8 orders. Two anchor peer-reviewed refs with DOIs (Pacoureau 2021 Nature; Dulvy 2021 Current Biology). Licensing gotchas flagged.
* .copilot-tracking/research/subagents/2026-06-13/web-tech-stack-research.md
  * Recommended stack: Astro (static + islands) · MDX content collections (+ Zod) · MapLibre GL JS + deck.gl · Observable Plot + D3 · Pagefind + Fuse.js · Astro Image/Sharp + `<model-viewer>` · Azure Static Web Apps Free + GitHub Actions. Includes sample directory tree and `content.config.ts`.
* .copilot-tracking/research/subagents/2026-06-13/content-pedagogy-research.md
  * Dual-track IA (Learn + Reference) with Scuba and Filmmaking pathway overlays; concrete per-species JSON schema with per-fact sourced-value objects; engaging features table; evidence-based pedagogy (Freeman et al. 2014 PNAS; CAST UDL 3.0; testing/spacing effects); CSE citation style; WCAG 2.2 AA.

### Project Conventions

* No existing `.github/copilot-instructions.md` in the workspace. Org context (`devopsabcs-engineering`) signals Azure + GitHub Actions alignment.

## Key Discoveries

### Project Structure

Greenfield. The selected architecture organizes content as git-versioned MDX/JSON with a Zod-validated schema as the source of truth, interactive widgets as Astro islands, and pre-baked occurrence data fetched from open APIs at build time. See the sample directory tree in the Technical Scenarios section.

### Implementation Patterns

* **Schema-as-source-of-truth with per-fact citations.** Every non-trivial factual field is a *sourced-value object* `{ value, unit?, sources:[citationId], confidence?, asOf }`, not a bare scalar. A central `citations[]` array holds full references with DOIs/URLs/accessed-dates. This operationalizes scientific credibility at the data layer.
* **External authority IDs anchor identity.** WoRMS **AphiaID** is the primary stable join key, plus Eschmeyer CoF, FishBase SpecCode, IUCN taxonId, GBIF key, iNaturalist taxonId, ITIS TSN. Enables verifiable cross-source enrichment and re-sync.
* **Build-time data baking.** Fetch GBIF/OBIS occurrences and IUCN range polygons at build, simplify, and store as GeoJSON in `public/data/` so the runtime site has no API dependency, no rate-limit exposure, and fast maps. OBIS also serves `.mvt` vector tiles directly to MapLibre for live zoom-aware layers.
* **Islands for the few interactive widgets.** Maps, charts, quizzes, and the catalog explorer hydrate independently and lazily (`client:visible`/`client:idle`); all other pages ship ~zero JS.
* **Dual-track IA with pathway overlays.** A *Learn* curriculum spine + a *Reference* species/glossary spine, with `diving` and `filming` schema sub-objects powering Scuba and Filmmaking pathway pages that re-surface the same biology/species through an applied lens.

### Authoritative Data Sources (summary)

| Source | Role | Auth | Format / join key | License note |
|---|---|---|---|---|
| [WoRMS REST](https://www.marinespecies.org/rest/) | Taxonomy backbone | None | JSON; AphiaID | Text CC-BY 4.0; images default CC BY-NC-SA 4.0; whole-DB redistribution needs agreement |
| [OBIS v3](https://api.obis.org/) | Marine occurrences | None | Darwin Core / GeoJSON / **.mvt tiles**; carries AphiaID + `redlist_category` | Open; no-token IUCN-category fallback via `/checklist/redlist` |
| [GBIF v1](https://techdocs.gbif.org/en/openapi/) | Broad occurrences | None (reads) / Basic Auth (downloads) | JSON; usageKey; async download ≤100k params | Per-dataset mix incl. CC0/CC-BY/CC-BY-NC; cite via download DOI |
| [IUCN Red List v4](https://api.iucnredlist.org/api-docs) | Conservation status | **Token** (sign-up) | JSON bearer; `class/CHONDRICHTHYES` | **Non-commercial only**; no scraping; cache + refresh per Red List version |
| [CITES Species+](https://api.speciesplus.net/documentation) | Trade appendices | **Token** (`X-Authentication-Token`) | JSON/XML; `cites_legislation` | UNEP-WCMC; several sharks on Appendix II |
| [Wikimedia Commons](https://commons.wikimedia.org/w/api.php) / [iNaturalist](https://api.inaturalist.org/v1/docs/) / [EOL](https://eol.org/docs/what-is-eol/classic-apis) / NOAA | Imagery | None for reads (iNat JWT only for writes) | Per-asset license via `extmetadata` / `license_code` / `licenses` filter | Per-asset attribution required; iNat open photos only on `inaturalist-open-data` host; NOAA generally public domain |

Mapping basemaps: [Esri World Ocean Base](https://www.arcgis.com/home/item.html?id=1e126e7520f9466c9ca28b8f28b5e500) (free, bathymetry, attribution, "not for navigation") under occurrence layers, with OSM/MapTiler land labels.

Anchor peer-reviewed references (with DOIs):

* Pacoureau, N. et al. (2021). "Half a century of global decline in oceanic sharks and rays." *Nature* 589: 567–571. doi:10.1038/s41586-020-03173-9 (~71% decline since 1970).
* Dulvy, N.K. et al. (2021). "Overfishing drives over one-third of all sharks and rays toward a global extinction crisis." *Current Biology* 31(21): 4773–4787.e8. doi:10.1016/j.cub.2021.08.062.
* Dulvy, N.K. et al. (2014). "Extinction risk and conservation of the world's sharks and rays." *eLife* 3: e00590. doi:10.7554/eLife.00590.
* Compagno, L.J.V. (1984). *Sharks of the World* (FAO Species Catalogue). ISBN 978-92-5-104543-5.
* Freeman, S. et al. (2014). "Active learning increases student performance in science, engineering, and mathematics." *PNAS* 111(23): 8410–8415. doi:10.1073/pnas.1319030111.

### Recommended Information Architecture

Dual-track + pathway-overlay model. Top-level sections:

1. **Home / Onboarding** — audience selector ("HS student exploring," "first-year marine bio student," "I dive," "I film") + ISAF-grounded myth-busting hero.
2. **Species Explorer (Reference)** — searchable/filterable index of 500+ species; per-species pages. Filters: order/family, IUCN status, ocean basin, depth zone, max size, reproductive mode, "divers encounter," "frequently filmed."
3. **Shark Biology Fundamentals** — anatomy, sensory systems (ampullae of Lorenzini, lateral line), physiology (buoyancy, osmoregulation, ventilation, regional endothermy), reproduction modes, age/growth.
4. **Taxonomy & Evolution** — Chondrichthyes; Elasmobranchii vs Holocephali; the ~8 living shark orders + families; 400+ Myr history; phylogenetic tree explorer.
5. **Ecology & Conservation** — trophic roles, vulnerability traits, threats (overfishing, finning, bycatch, climate), management (MPAs, ISRAs, CITES, finning bans), citizen science.
6. **Pathway: Scuba Diving with Sharks** — risk in context, ethical diving, certifications, reading behavior, species by region, choosing operators, contributing data.
7. **Pathway: Underwater Shark Filmmaking** — cameras/housings, lenses/ports, lighting, technique, ethics (no harassment), the baiting/chumming controversy, permits, getting started, notable cinematographers/films.
8. **Careers & Get Involved** — study pathways, internships, research programs, citizen science, professional societies, "day in the life."
9. **Toolkit (cross-cutting)** — glossary + pronunciation, interactive ID key, data explorer, quizzes, citations/methods, "how we know what we know."

Navigation principle: every concept page deep-links to exemplar species; every species page surfaces "related biology," "where divers see it," and "notable footage" so the three audiences cross-pollinate.

### Engaging Interactive Features (data-backed)

| Feature | What it does | Grounding / data source |
|---|---|---|
| Interactive dichotomous ID key | Step-through couplets to ID a shark to family/species | Mirrors real taxonomic keys (FAO / elasmo-key.org) |
| Size & depth comparison visualizer | Scale species vs human diver + depth column | `size.maxTotalLength`, `depthRangeM` fields |
| Migration / tracking map | Animated tracks + range polygons | OCEARCH / tagging datasets; IUCN range maps |
| Conservation-status dashboard | Filter/sort by IUCN category, trend, region; % threatened | IUCN Red List + SSG 2024 report |
| Spaced-repetition taxonomy trainer | Flashcards/quizzes scheduled over time | Testing + spacing effects |
| "Build a dive plan" | Region/season → species, depth/cert, operators, logging | `diving` overlay + range/depth + citizen science |
| "Plan a shoot" | Target species/location → gear, light, ethics, permits | `filming` overlay |
| Glossary + pronunciation | Definitions + audio of binomials | UDL 2.1 clarify vocabulary |
| "What are the odds?" risk explainer | Shark-bite risk vs everyday risks, real ISAF numbers | ISAF "What are the Odds?" |
| Citizen-science contribution hub | Submit eggcase finds, dive sightings, iNaturalist obs | Great Eggcase Hunt, Shark Log, iNaturalist |

### Pedagogy & Credibility (evidence-grounded)

* Active learning over passive reading (Freeman et al. 2014: +6% exam scores, STEM failure 34%→22%); every concept page ends with a low-stakes interactive.
* UDL 3.0 (CAST 2024) drives multiple means of engagement/representation/action; tiered depth (concise core ~grade 8–10 + expandable college-level "Going deeper").
* Spaced repetition + retrieval practice for taxonomy (testing/spacing effects).
* Responsible misconception correction using **refutation-text** pattern + ISAF framing ("unprovoked bites," base rates); no fear-mongering imagery; pair risk facts with risk-reduction.
* **CSE name-year** citations (science-discipline standard) with per-fact sourcing and DOIs; optional APA toggle.
* "Reviewed by … on …" expert badge per page (`reviewedBy` + `lastReviewed`); content dating (`created`/`lastUpdated`/`lastReviewed`); `confidence`/`evidenceLevel` tags ("well-established," "emerging," "contested") and "Active research question" callouts.
* WCAG 2.2 AA: semantic HTML, keyboard nav, contrast ≥4.5:1, alt text, captions/transcripts (essential for filmmaking video), no color-only status (pair IUCN colors with labels/icons), `prefers-reduced-motion`; map/chart islands paired with data-table/text alternatives.

### Complete Examples

Per-species schema (abbreviated; full draft in content-pedagogy subagent doc). Pattern: factual fields are sourced-value objects; a central `citations[]` holds full references; external authority IDs anchor identity.

```jsonc
{
  "id": "carcharodon-carcharias",
  "schemaVersion": "1.0.0",
  "record": {
    "created": "2026-06-13", "lastUpdated": "2026-06-13", "lastReviewed": "2026-06-13",
    "reviewedBy": [{ "name": "Dr. Jane Doe", "credentials": "PhD", "affiliation": "Univ. X", "orcid": "0000-0000-0000-0000" }],
    "taxonomicAuthorityVersion": "WoRMS accessed 2026-06-13"
  },
  "identity": {
    "scientificName": "Carcharodon carcharias",
    "authorship": "(Linnaeus, 1758)",
    "commonNames": [{ "name": "Great white shark", "lang": "en", "preferred": true, "sources": ["worms"] }],
    "pronunciation": { "ipa": "/ˌkɑːrkəˈroʊdɒn ˌkɑːrkəˈraɪ.əs/", "audioUrl": "/audio/carcharodon-carcharias.mp3" }
  },
  "externalIds": { "wormsAphiaId": 105838, "fishbaseSpecCode": 751, "iucnTaxonId": 3855, "gbifTaxonKey": 2418892, "inaturalistTaxonId": 51480 },
  "taxonomy": { "class": "Chondrichthyes", "subclass": "Elasmobranchii", "order": "Lamniformes", "family": "Lamnidae", "genus": "Carcharodon", "species": "carcharias", "sources": ["worms", "eschmeyer-cof"] },
  "morphology": { "size": { "maxTotalLength": { "value": 600, "unit": "cm", "sources": ["fishbase"], "confidence": "well-established", "asOf": "2026" } } },
  "distribution": { "depthRangeM": { "min": 0, "max": 1200, "typicalMin": 0, "typicalMax": 250, "sources": ["fishbase"] } },
  "conservation": { "iucn": { "category": "VU", "criteria": "A2bd", "populationTrend": "decreasing", "assessmentYear": 2018, "assessmentUrl": "https://www.iucnredlist.org/species/3855/...", "sources": ["iucn-ssg"] }, "citesAppendix": { "value": "II", "sources": ["cites"] } },
  "diving": { "commonlyEncountered": true, "typicalEncounterDepthM": { "min": 0, "max": 30 }, "cageDivingCommon": true },
  "filming": { "frequentlyFilmed": true, "baitingControversy": { "text": "Chumming/baiting can alter natural behavior and is debated.", "sources": ["citation-baiting-1"] } },
  "citations": [
    { "id": "worms", "type": "database", "title": "WoRMS — Carcharodon carcharias", "url": "https://www.marinespecies.org/aphia.php?p=taxdetails&id=105838", "accessedDate": "2026-06-13", "license": "CC-BY-4.0" },
    { "id": "iucn-assessment-3855", "type": "assessment", "title": "Carcharodon carcharias — IUCN Red List", "year": 2018, "url": "https://www.iucnredlist.org/species/3855/..." }
  ]
}
```

Illustrative Astro `content.config.ts` (Zod schema + cross-collection references):

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
    gbifTaxonKey: z.number().optional(),
    obisAphiaId: z.number().optional(),
    citations: z.array(reference('citations')).default([]),
    relatedSpecies: z.array(reference('species')).default([]),
  }),
});

export const collections = { species };
```

### API and Schema Documentation

* WoRMS REST: `https://www.marinespecies.org/rest/` — AphiaID endpoints, classification, vernaculars, external IDs. No key.
* OBIS v3: `https://api.obis.org/` — `/occurrence/points` (GeoJSON), `/occurrence/tile/{x}/{y}/{z}.mvt` (vector tiles for MapLibre), `/checklist/redlist`.
* GBIF v1: `https://api.gbif.org/v1/` — `/species/match`, `/occurrence/search`, async `/occurrence/download/request` (≤100k params, gives citation DOI).
* IUCN Red List v4: `https://api.iucnredlist.org/api/v4/` — token bearer; `/taxa/class/CHONDRICHTHYES`, `/assessment/{id}`, `/information/red_list_version`. **Non-commercial only.**
* CITES Species+: `https://api.speciesplus.net/api/v1/` — `X-Authentication-Token` header; `/taxon_concepts/:id/cites_legislation`.
* Astro Content Collections: https://docs.astro.build/en/guides/content-collections/ — `defineCollection()`, Zod schema, `reference()`, `getCollection()`, suitable for tens of thousands of entries.

### Configuration Examples

Azure Static Web Apps + GitHub Actions CI shape (build runs `astro build`, which also triggers Pagefind indexing and Sharp image optimization, then deploys; PRs get preview URLs):

```yaml
# .github/workflows/azure-static-web-apps.yml (shape — token + IDs filled at setup)
name: Azure Static Web Apps CI/CD
on:
  push: { branches: [main] }
  pull_request: { types: [opened, synchronize, reopened, closed], branches: [main] }
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build          # astro build → Pagefind index + optimized images
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          app_location: "/"
          output_location: "dist"
```

## Technical Scenarios

### Scenario A — Site Architecture: Static/JAMstack (Astro islands) vs Full-stack vs CMS-monolith

For a read-mostly, content-rich educational catalog (500+ species, lessons, maps, quizzes, citations), the static/JAMstack approach wins on performance, SEO, cost (free static hosting), security (no server attack surface), and longevity.

**Requirements:**

* 500+ content-heavy pages with strong SEO and Core Web Vitals.
* A handful of interactive widgets (maps, charts, quizzes, search) that should not bloat every page.
* Free/low-cost hosting; git-reviewable scientific content; type-safe content validation.

**Preferred Approach:**

* **Astro with static output + islands architecture.** Pages render to static HTML with ~zero JS by default; interactive widgets opt in via `client:*` directives and hydrate lazily. MDX content collections with Zod schemas give type-safe, validated content explicitly suited to "tens of thousands of entries" — comfortably covering 500+ species. Rationale: directly targets LCP/INP/CLS, keeps non-interactive pages JS-free, and the few dynamic bits are client-side islands fed by pre-built data.

```text
finfacts/
├─ .github/workflows/azure-static-web-apps.yml   # build + deploy to Azure SWA
├─ public/
│  ├─ models/                                     # optimized .glb anatomy models (Draco)
│  ├─ data/
│  │  ├─ occurrences/                             # pre-baked per-species GeoJSON (GBIF/OBIS)
│  │  └─ ranges/                                  # simplified IUCN range polygons (GeoJSON)
│  └─ favicon.svg
├─ src/
│  ├─ content.config.ts                           # defineCollection() + Zod schemas + reference()
│  ├─ content/
│  │  ├─ species/                                 # 500+ MDX entries (one per species)
│  │  ├─ families/                                # taxonomy nodes
│  │  ├─ lessons/                                 # educational long-form MDX
│  │  └─ citations/                               # reusable reference entries (JSON, DOIs)
│  ├─ components/
│  │  ├─ DistributionMap.tsx                      # MapLibre + deck.gl island (client:visible)
│  │  ├─ SizeComparison.tsx                       # D3 shark-vs-human island
│  │  ├─ DepthZones.tsx                           # D3/Plot depth-range visualization
│  │  ├─ ConservationChart.tsx                    # Observable Plot island
│  │  ├─ SpeciesExplorer.tsx                      # Fuse.js client-side filter/grid island
│  │  ├─ Quiz.tsx                                 # interactive quiz island
│  │  └─ Citations.astro                          # renders citation refs + JSON-LD
│  ├─ layouts/{BaseLayout,SpeciesLayout}.astro    # head, SEO meta, JSON-LD, a11y skip-links
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ species/[...id].astro                    # getStaticPaths() → page per species
│  │  ├─ explore.astro                            # catalog explorer (Fuse.js island)
│  │  ├─ map.astro                                # global distribution map
│  │  ├─ lessons/[...id].astro
│  │  └─ search.astro                             # Pagefind UI
│  ├─ lib/{gbif,obis,schema-org}.ts               # build-time fetch + JSON-LD builders
│  └─ styles/global.css
├─ scripts/fetch-occurrences.mjs                  # prebuild: GBIF/OBIS → public/data/*.geojson
├─ public/admin/                                  # (optional) Decap CMS config + index.html
├─ astro.config.mjs                               # integrations: mdx, sitemap, preact, pagefind
└─ package.json
```

**Implementation Details:**

* Content management: start with git-based MDX content collections (free, versioned, PR-reviewable — ideal for citation/accuracy review by a domain expert; Zod schema prevents malformed entries). Optionally layer **Decap CMS** (MIT, git-backed form UI via GitHub OAuth) for non-technical biologist editors. Reach for headless SaaS (Sanity/Contentful) only if editorial scale/collaboration demands it — Astro can swap to a CMS loader later at low cost.

#### Considered Alternatives

* **Next.js App Router / Remix (full-stack SSR).** Excellent but ship a React runtime oriented to app-like SSR; more JS and hosting complexity than needed for read-only content. Next static export is viable but loses much of Next's purpose while still carrying React overhead vs Astro's zero-JS default. Rejected: unnecessary runtime weight and infra for a content site.
* **Hugo (Go SSG).** Blazing builds but Go templating is less ergonomic for rich embedded interactive widgets and MDX; weaker islands story. Rejected: poorer fit for interactive educational components.
* **Eleventy (11ty).** Superb lightweight JS SSG; fine runner-up, but you assemble the interactivity/islands/image pipeline yourself. Rejected in favor of Astro's batteries-included images + collections + islands.
* **WordPress/Drupal CMS-monolith.** Good for non-technical editors but heavy, plugin/security maintenance, weaker Core Web Vitals, PHP hosting. Rejected: performance/security/cost disadvantages for a static-friendly corpus.

### Scenario B — Interactive Mapping: MapLibre GL JS + deck.gl vs Mapbox vs Leaflet

Distribution maps must render potentially 100k+ occurrence points plus IUCN range polygons, free of per-load billing.

**Requirements:**

* Render GBIF/OBIS occurrences and IUCN range polygons.
* No per-map-load billing trap; open-source license; large-point performance.
* Free, marine-appropriate basemaps with proper attribution.

**Preferred Approach:**

* **MapLibre GL JS (BSD-3, no API key) as the base engine + deck.gl (MIT) overlaid for dense occurrence/tracking layers.** MapLibre is the free community fork of Mapbox GL JS v1 (before it went proprietary), with WebGL vector rendering and no per-load billing. deck.gl's `ScatterplotLayer`/`HexagonLayer` render 100k+ points with aggregation/heatmaps. Bake per-species occurrences to GeoJSON at build (via GBIF download DOI + OBIS) or consume OBIS `.mvt` tiles at runtime. Basemap: Esri World Ocean Base (bathymetry) under occurrence layers + OSM/MapTiler land labels, attributed in the map UI.

**Implementation Details:**

* Accessibility: maps are not perceivable to screen-reader users — always pair the map island with a text summary and/or a data table of occurrence/range, add keyboard navigation and ARIA labels (the paired-data-table pattern).

#### Considered Alternatives

* **Mapbox GL JS.** Polished styles/Studio, but proprietary (v2+), free tier capped at 50,000 map loads/month then billed; commercial-license risk. Rejected as default to avoid billing + proprietary lock-in for a free educational site.
* **Leaflet.** Simplest API, tiny, huge plugin ecosystem, but raster DOM/Canvas rendering struggles with very large point sets and is less smooth at scale. Acceptable only if datasets stay small; rejected as the primary for large occurrence layers.

### Scenario C — Conservation Data Source: IUCN Red List API (token, non-commercial) vs OBIS no-token fallback vs IBAT

Conservation status is central to scientific value, but the IUCN Red List API has the project's most restrictive license.

**Requirements:**

* Authoritative IUCN category + assessment metadata (criteria, year, trend, URL) per species.
* CITES trade-appendix status.
* Respect licensing for the site's actual commercial/non-commercial status.

**Preferred Approach (pending the commercial-use confirmation):**

* If `finfacts` is **non-commercial educational** (most likely): use **IUCN Red List API v4** (free token; cache results, refresh per Red List version confirmed at runtime via `/information/red_list_version`; cite "IUCN <year>. IUCN Red List …"). Add **CITES Species+** (token) for trade appendices. Store full assessment metadata in the schema's `conservation.iucn` object, never a bare label.
* Regardless of token status, use **OBIS `/checklist/redlist`** (no token) as a resilient fallback that surfaces IUCN categories for marine taxa.

**Implementation Details:**

* The IUCN API forbids commercial use and scraping. If the site is ever deemed commercial, the conservation-data architecture must switch to **IBAT** licensing — a material change. This must be confirmed before relying on the IUCN API.

#### Considered Alternatives

* **OBIS-only conservation categories (no token).** Simplest and license-clean, but lacks full assessment metadata (criteria/trend/DOI) and currency guarantees. Use as fallback, not primary.
* **Hand-curated conservation facts from published assessments.** Maximally license-safe and citable per fact, but labor-intensive and quickly stale. Viable for a small curated launch set; the schema's per-fact sourcing supports it.

### Scenario D — Hosting/CI: Azure Static Web Apps + GitHub Actions vs Cloudflare Pages vs others

The repo's org (`devopsabcs-engineering`) makes Azure + GitHub the natural posture.

**Requirements:**

* Free static hosting + SSL + custom domain + PR preview environments.
* GitHub-native CI/CD.
* A path to add serverless functions later (e.g., quiz scoring) without re-platforming.

**Preferred Approach:**

* **Azure Static Web Apps Free tier + GitHub Actions.** Org-aligned; free hosting + auto-renewing SSL, 2 custom domains, 3 PR preview environments, 100 GB bandwidth, and built-in managed Azure Functions (1M free executions) for future quiz scoring/contact forms. The Astro static output is host-agnostic, so switching later is low-risk. Drawback: Free tier has no SLA and hard quotas.

#### Considered Alternatives

* **Cloudflare Pages.** Generous free tier, unlimited bandwidth, fast edge — the strongest fallback if Azure Free-tier bandwidth/SLA limits bite. Rejected as default only for org-alignment reasons.
* **Netlify.** Great DX, pairs naturally with Decap CMS, but bandwidth/build-minute limits on free tier. Viable alternative.
* **Vercel.** Best for Next.js, fine for Astro static, but Hobby tier has commercial-use restrictions. Less aligned.
* **GitHub Pages.** Simplest/free but no PR previews, no serverless, weaker headers/redirects control. Minimal fallback only.

## Critical Decision Points (need user input)

1. **Commercial vs non-commercial.** Is `finfacts` commercial? If yes, the **IUCN Red List API is not permitted** (would require IBAT licensing) — materially changes conservation-data architecture. (Most educational sites qualify as non-commercial.)
2. **Scope.** Sharks only (~500+ extant sharks) or all chondrichthyans (sharks + rays/batoids + chimaeras, ~1,300+)? Affects WoRMS query roots, schema population, and database sizing. Default: sharks-primary with optional expansion.
3. **Editing audience.** Developers only (git/MDX is sufficient) or non-technical biologists too (justifies Decap CMS or a headless SaaS)?
4. **Quiz persistence.** Do quizzes need user accounts / score tracking? Yes → Azure Functions (SWA managed API) backend; otherwise fully static.
5. **Data ingestion mode.** Programmatic ingestion of IUCN/FishBase/WoRMS (license + rate limits apply) vs hand-curated with citations for a launch set?
6. **Offline/PWA.** Is offline/classroom/field use without connectivity needed?
7. **Localization.** Which languages first (drives i18n effort and which Shark Trust-style multilingual guides to mirror)?

## Recommended Next Steps for Implementation

1. Confirm the four-to-seven decision points above (especially #1 commercial status and #2 scope).
2. Scaffold the Astro project (static output, MDX, Pagefind, sitemap, Preact island integration) with the directory tree from Scenario A.
3. Define `content.config.ts` Zod schemas for `species`, `families`, `lessons`, `citations` mirroring the per-species schema (required: identity, externalIds, taxonomy, conservation.iucn).
4. Build `scripts/fetch-occurrences.mjs` to pull GBIF (download DOI) + OBIS occurrences and IUCN ranges at build, simplify to GeoJSON in `public/data/`.
5. Implement the core islands: `DistributionMap` (MapLibre + deck.gl), `SpeciesExplorer` (Fuse.js), `ConservationChart` (Observable Plot), `SizeComparison`/`DepthZones` (D3), `Quiz`.
6. Stand up the Azure Static Web Apps + GitHub Actions pipeline; verify PR preview environments.
7. Seed a credible launch set (e.g., the 8 orders' flagship species) with full per-fact citations and an expert-review badge, then expand the catalog.
8. Wire accessibility + SEO gates (axe-core, Lighthouse CI, JSON-LD `LearningResource`/`Article`, sitemap, paired data tables for maps/charts).
