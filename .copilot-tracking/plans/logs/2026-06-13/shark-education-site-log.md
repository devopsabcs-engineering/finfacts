<!-- markdownlint-disable-file -->
# Planning Log: Shark Education Website (FinFacts)

## Discrepancy Log

Gaps and differences identified between research findings and the implementation plan.

### Unaddressed Research Items

* DR-01: Live WoRMS / shark-references authoritative extant species count and family breakdown not yet retrieved
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Potential Next Research, item 2)
  * Reason: Plan sizes the catalog from the secondary Wikipedia figure (~557 described + 23 undescribed); a primary datable count is a content-curation task deferred to ingestion
  * Impact: low — does not block scaffolding, schema, or pipeline; refines catalog sizing during content authoring
  * Accuracy note (validator): details Step 1.1 and Step 5.2 cite "DR-01 (scope default)" / "DR-01 (scope)", but DR-01 here is the species *count*; scope is decision point PD-02. The details file mislabels the reference.
  * Resolution (planner): details Steps 1.1 and 5.2 re-pointed to PD-02 (scope). Closed.

* DR-02: OCEARCH / Global Shark Movement Project telemetry access and terms not investigated
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Potential Next Research, item 4)
  * Reason: Migration/tracking map is a later enhancement; range polygons and occurrences ship first
  * Impact: medium — the animated tracks feature cannot be built until terms are confirmed (see WI-03)
  * Accuracy note (validator): details Step 3.2 cites "DR-02 (commercial-use confirmation)", but commercial-use is decision point PD-01; DR-02 here is OCEARCH telemetry. The details file mislabels the reference.
  * Resolution (planner): details Step 3.2 re-pointed to PD-01 (commercial use). Closed.

* DR-03: FishBase/SeaLifeBase and Eschmeyer Catalog of Fishes programmatic access + license not confirmed
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Potential Next Research, item 6)
  * Reason: Morphology/nomenclature enrichment can start from curated values; programmatic enrichment deferred
  * Impact: low — schema already holds FishBase SpecCode; enrichment is additive
  * Accuracy note (validator): details Step 4.2 cites "DR-03 (quiz persistence)", but quiz persistence is DD-03; DR-03 here is FishBase/Eschmeyer access. The details file mislabels the reference.
  * Resolution (planner): details Step 4.2 re-pointed to DD-03 (quiz persistence). Closed.

* DR-04: Pathway authoring source material not researched (dichotomous-key source FAO/elasmo-key.org, named cinematographers/films, Green Fins-style diving safety/ethics codes, exemplar-site differentiation)
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Potential Next Research, item 5); content-pedagogy-research.md (§Pathway sections 6-7)
  * Reason: Plan Steps 5.2 and 6.2 author Scuba/Filmmaking pathway pages and overview content, but the concrete authoritative sources needed to write them credibly were flagged as not-yet-researched and are not captured as a follow-on
  * Impact: medium — pathway content cannot be authored to the site's citable-rigor bar until these sources are gathered; blocks credible completion of Steps 5.2/6.2
  * Resolution (planner): captured as a hard dependency on details Steps 4.2 (IdentificationKey couplet source) and 6.2 (pathway/careers source material), and added as follow-on WI-08 (pathway-source research). The architecture/plan does not depend on it; content authoring does. Tracked, not blocking planning.
  * Verification (validator, re-run): WI-08 present in Suggested Follow-On Work (sourced to research item 5; DR-04, DR-05); details Step 4.2 Dependencies and Step 6.2 Dependencies both cite "DR-04 resolution" as a hard dependency, and Step 6.2 body enumerates the four source classes. Confirmed resolved.

* DR-05: Interactive dichotomous ID key feature omitted from the plan
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Engaging Interactive Features, row 1; §Recommended Information Architecture, Toolkit #9); content-pedagogy-research.md (§4, ID key)
  * Reason: Plan island set (details Steps 4.1/4.2) covers map, explorer, conservation chart, size/depth, and quiz, but not the dichotomous ID key; no step authors it; it depends on the unresearched key source in DR-04
  * Impact: medium — a signature "authentic taxonomic skill" feature called out twice in research is unplanned
  * Resolution (planner): added the IdentificationKey island to details Step 4.2 and surfaced it in plan Step 4.2 and the Toolkit page (Step 5.2); couplet source tracked via DR-04/WI-08. Closed.
  * Verification (validator, re-run): details Step 4.2 lists `src/components/IdentificationKey.tsx` with an "Addresses DR-05" reference and a success criterion (couplet step-through with text fallback); plan Step 4.2 title names IdentificationKey; plan/details Step 5.2 toolkit.astro lists "ID key." Confirmed resolved.

* DR-06: Island/map bundle-size performance budget not quantified
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Potential Next Research, item 3); web-tech-stack-research.md (§3, deck.gl "heavier bundle")
  * Reason: Plan Step 4.3 verifies islands use client:* directives and non-interactive pages ship ~zero JS, but sets no numeric bundle budget for the map/deck.gl island flagged in research
  * Impact: low-medium — partial coverage; the performance-budget guardrail is unmeasured
  * Resolution (planner): plan Step 4.3 now sets a numeric budget for the deck.gl map island (≤250 KB gzipped, lazy-loaded) enforced via Lighthouse CI (Step 7.2). Closed.
  * Verification (validator, re-run): plan Step 4.3 verification text reads "the deck.gl map island stays within its JS bundle budget (e.g., ≤250 KB gzipped, lazy-loaded)"; plan Step 7.2 wires Lighthouse CI (Core Web Vitals) as the enforcing gate. Confirmed resolved.

* DR-07: Several engaging interactive features under-specified or omitted
  * Source: .copilot-tracking/research/2026-06-13/shark-education-site-research.md (§Engaging Interactive Features); content-pedagogy-research.md (§4)
  * Reason: "Build a dive plan" and "Plan a shoot" planners, the "What are the odds?" risk explainer (only partially covered by the home ISAF hero in Step 5.2), and the citizen-science contribution hub are not explicit islands or content steps, and are not logged as WI- follow-ons; Careers & Get Involved appears in the IA (Step 5.2) but has no content-authoring step in Phase 6
  * Impact: low-medium — engagement features that serve the scuba/filming sub-audiences are partial; reasonable to defer but currently untracked
  * Resolution (planner): added DivePlanner, ShootPlanner, RiskExplainer, and CitizenScienceHub islands to details Step 4.2, and added a Careers content-authoring entry to details Step 6.2 plus a careers/toolkit page to Step 5.2. Closed.
  * Verification (validator, re-run): details Step 4.2 lists DivePlanner.tsx, ShootPlanner.tsx, RiskExplainer.tsx, CitizenScienceHub.tsx with an "Addresses DR-07" reference; details Step 5.2 adds `src/pages/careers.astro`, Step 6.2 adds `src/content/lessons/careers.mdx`, and plan Steps 5.2/6.2 reference careers content. Confirmed resolved.

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
  * Accuracy note (validator): details Step 4.1 cites "DD-03 (mapping engine)", but the mapping-engine choice is IP-04; DD-03 here is the quiz-persistence default. The details file mislabels the reference.

* DD-04: Details file systematically mislabels discrepancy-ID cross-references
  * Research recommends: n/a — this is a plan/details internal-consistency defect, not a research divergence
  * Plan implements: details "Discrepancy references" cite DR-01/DR-02/DR-03/DD-03 with meanings that do not match this log (see accuracy notes on DR-01, DR-02, DR-03, DD-03); correct targets are PD-02 (scope), PD-01 (commercial use), DD-03 (quiz persistence), and IP-04 (mapping engine) respectively
  * Rationale: Line-number cross-references between plan and details are all correct, but the discrepancy-ID labels in the details file are wrong, breaking traceability; the planner should re-point details Steps 1.1, 3.2, 4.1, 4.2, and 5.2 to the correct IDs
  * Resolution (planner): details Steps 1.1 and 5.2 → PD-02; Step 3.2 → PD-01; Step 4.1 → IP-04; Step 4.2 → DD-03. All five references corrected. Closed.
  * Verification (validator, re-run): inspected all five details Discrepancy references — Step 1.1 "PD-02 (scope default)", Step 3.2 "PD-01 (commercial-use confirmation)", Step 4.1 "IP-04 (mapping engine)", Step 4.2 "DD-03 (quiz persistence)", Step 5.2 "PD-02 (scope)". All match this log's IDs; traceability restored. Plan↔details line-number cross-references re-checked after the file grew — every start line matches the actual step heading. Confirmed resolved.

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
* WI-08: Gather pathway authoring sources (FAO/elasmo-key dichotomous key, named cinematographers/films, Green Fins-style diving ethics codes, exemplar-site differentiation) — high
  * Source: research §Potential Next Research item 5; DR-04, DR-05
  * Dependency: Precedes credible authoring of Steps 5.2/6.2 pathway content and the IdentificationKey island couplets

## Decision Points (defaults applied; confirm to override)

The plan proceeds on the research-recommended defaults below. Confirming or overriding these does not block planning but affects later phases.

* PD-01 Commercial status: assumed non-commercial educational → IUCN Red List API v4 permitted with OBIS fallback. If commercial, conservation-data architecture must switch to IBAT licensing (material change).
* PD-02 Scope: assumed sharks-primary (~500+ extant) with chondrichthyan expansion ready (WI-07).
* PD-03 Editing audience: assumed developers via git/MDX; Decap CMS deferred (WI-04).
* PD-04 Quiz persistence: assumed fully static, no accounts; Azure Functions deferred (WI-02).
* PD-05 Data ingestion: hybrid programmatic baking + curated launch set (DD-02).
* PD-06 Offline/PWA: assumed not needed initially (WI-06).
* PD-07 Localization: assumed English first (WI-05).
