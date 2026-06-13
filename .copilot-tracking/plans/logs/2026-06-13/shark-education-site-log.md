<!-- markdownlint-disable-file -->
# Planning Log: Shark Education Website (FinFacts)

## Discrepancy Log

Gaps and differences identified between research findings and the implementation plan.

### Unaddressed Research Items

* DR-01: Live WoRMS / shark-references authoritative extant species count and family breakdown not yet retrieved
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Potential Next Research, item 2)
  * Reason: Plan sizes the catalog from the secondary Wikipedia figure (~557 described + 23 undescribed); a primary datable count is a content-curation task deferred to ingestion
  * Impact: low — does not block scaffolding, schema, or pipeline; refines catalog sizing during content authoring

* DR-02: OCEARCH / Global Shark Movement Project telemetry access and terms not investigated
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Potential Next Research, item 4)
  * Reason: Migration/tracking map is a later enhancement; range polygons and occurrences ship first
  * Impact: medium — the animated tracks feature cannot be built until terms are confirmed (see WI-03)

* DR-03: FishBase/SeaLifeBase and Eschmeyer Catalog of Fishes programmatic access + license not confirmed
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Potential Next Research, item 6)
  * Reason: Morphology/nomenclature enrichment can start from curated values; programmatic enrichment deferred
  * Impact: low — schema already holds FishBase SpecCode; enrichment is additive

### Plan Deviations from Research

* DD-01: Plan implements the full per-species sourced-value schema, not the abbreviated Zod sample
  * Research recommends: An illustrative abbreviated `content.config.ts` Zod schema plus a fuller JSON schema draft
  * Plan implements: The full sourced-value object pattern with central citations[], externalIds, and record/review metadata in content.config.ts
  * Rationale: The abbreviated sample omits per-fact sourcing; the full pattern is the core credibility requirement

* DD-02: Plan adopts a hybrid data-ingestion mode (programmatic baking + curated launch set)
  * Research recommends: Presents programmatic vs hand-curated as an open decision point (decision point #5)
  * Plan implements: Build-time programmatic baking for occurrences/ranges plus a hand-curated, fully cited launch seed set
  * Rationale: Combines the credibility of curated launch content with the scalability of baked occurrence data; resolves the decision with the lowest-risk default

* DD-03: Plan defaults quizzes to fully static client-side with no accounts
  * Research recommends: Decision point #4 leaves quiz persistence open (static vs Azure Functions backend)
  * Plan implements: Client-side quiz with spaced-repetition scheduling, no server persistence
  * Rationale: Keeps the launch fully static and free-tier friendly; Azure Functions scoring deferred to follow-on work (WI-02)

## Implementation Paths Considered

### Selected: Astro static/JAMstack with islands + git-based MDX content + build-time data baking

* Approach: Static Astro output, MDX content collections with Zod schemas as source of truth, interactive widgets as lazily hydrated islands, occurrence/range data pre-baked to GeoJSON, deployed to Azure Static Web Apps via GitHub Actions
* Rationale: Best fit for a read-mostly, content-rich catalog — performance, SEO, free hosting, security, git-reviewable scientific content, type-safe validation
* Evidence: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Scenario A Preferred Approach; §Outline item 1)

### IP-01: Next.js / Remix full-stack SSR

* Approach: React-based SSR framework with optional static export
* Trade-offs: Excellent app-like DX and dynamic capabilities, but ships a React runtime and more JS/hosting complexity than a read-only content site needs
* Rejection rationale: Unnecessary runtime weight and infrastructure; static export loses much of Next's purpose while keeping React overhead vs Astro's zero-JS default

### IP-02: Hugo / Eleventy SSG

* Approach: Go (Hugo) or JS (Eleventy) static site generators
* Trade-offs: Very fast builds (Hugo) or lightweight flexibility (Eleventy), but weaker islands story and you assemble the interactivity/image pipeline yourself
* Rejection rationale: Poorer fit for rich embedded interactive educational widgets vs Astro's batteries-included images + collections + islands

### IP-03: WordPress / Drupal CMS-monolith

* Approach: PHP CMS with plugin ecosystem and non-technical editor UI
* Trade-offs: Friendly for non-technical editors, but heavy, plugin/security maintenance, weaker Core Web Vitals, PHP hosting
* Rejection rationale: Performance, security, and cost disadvantages for a static-friendly scientific corpus

### IP-04: Mapbox GL JS / Leaflet for mapping (vs selected MapLibre + deck.gl)

* Approach: Mapbox GL JS (polished, proprietary) or Leaflet (simple, raster)
* Trade-offs: Mapbox has billing/proprietary lock-in past free caps; Leaflet struggles with very large point sets
* Rejection rationale: MapLibre (BSD-3, no key) + deck.gl (MIT) render 100k+ points with no per-load billing and an open license

## Suggested Follow-On Work

Items identified during planning that fall outside current scope.

* WI-01: Expand catalog from launch seed set to full extant shark coverage (~500+ species) — high
  * Source: research §Recommended Next Steps step 7; DR-01
  * Dependency: Phase 2 schema and Phase 6 seed set complete; authoritative WoRMS count retrieved
* WI-02: Add Azure Functions backend for quiz score tracking / user accounts — medium
  * Source: research decision point #4; DD-03
  * Dependency: Static launch deployed; product decision on accounts
* WI-03: Build migration/tracking map with OCEARCH / Global Shark Movement telemetry — medium
  * Source: research §Engaging Interactive Features; DR-02
  * Dependency: OCEARCH/GSMP data access and embedding terms confirmed
* WI-04: Layer Decap CMS (git-backed) for non-technical biologist editors — low
  * Source: research §Scenario A Implementation Details; decision point #3
  * Dependency: Editorial demand confirmed; GitHub OAuth app configured
* WI-05: Add localization/i18n for additional languages — low
  * Source: research decision point #7
  * Dependency: Target languages chosen; mirror Shark Trust-style multilingual guides
* WI-06: Optional PWA/offline support for classroom/field use — low
  * Source: research decision point #6
  * Dependency: Offline requirement confirmed
* WI-07: Expand scope to all chondrichthyans (rays/batoids + chimaeras, ~1,300+) — low
  * Source: research decision point #2; DR-01
  * Dependency: Scope decision; WoRMS query roots extended

## Decision Points (defaults applied; confirm to override)

The plan proceeds on the research-recommended defaults below. Confirming or overriding these does not block planning but affects later phases.

* PD-01 Commercial status: assumed non-commercial educational → IUCN Red List API v4 permitted with OBIS fallback. If commercial, conservation-data architecture must switch to IBAT licensing (material change).
* PD-02 Scope: assumed sharks-primary (~500+ extant) with chondrichthyan expansion ready (WI-07).
* PD-03 Editing audience: assumed developers via git/MDX; Decap CMS deferred (WI-04).
* PD-04 Quiz persistence: assumed fully static, no accounts; Azure Functions deferred (WI-02).
* PD-05 Data ingestion: hybrid programmatic baking + curated launch set (DD-02).
* PD-06 Offline/PWA: assumed not needed initially (WI-06).
* PD-07 Localization: assumed English first (WI-05).
