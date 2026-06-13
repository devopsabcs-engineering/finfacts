---
applyTo: '.copilot-tracking/changes/2026-06-13/shark-education-site-changes.md'
---
<!-- markdownlint-disable-file -->
# Implementation Plan: Shark Education Website (FinFacts)

## Overview

Build a scientifically rigorous, engaging Astro static site covering all extant shark species, serving first-year marine biology undergraduates and serious high-school students with first-class Scuba and Filmmaking pathways, grounded in open scientific data APIs and per-fact citations.

## Objectives

### User Requirements

* Educational website covering all species of sharks on the planet — Source: userRequest "make the plan"; research §Task Implementation Requests
* Audience first-year marine biology undergrads + serious high-school students — Source: research §Scope and Success Criteria
* Scuba diving and underwater shark filmmaking served as first-class pathways — Source: research §Recommended Information Architecture (sections 6-7)
* Engaging UX paired with real scientific rigor and authoritative sourcing — Source: research §Pedagogy & Credibility

### Derived Objectives

* Schema-as-source-of-truth with per-fact sourced-value objects and a central citations array — Derived from: research §Implementation Patterns ("schema-as-source-of-truth with per-fact citations")
* Build-time baking of GBIF/OBIS occurrences and IUCN ranges to static GeoJSON — Derived from: research §Implementation Patterns ("build-time data baking") to eliminate runtime API dependency and rate limits
* Islands architecture so non-interactive pages ship ~zero JS — Derived from: research §Scenario A Preferred Approach
* WCAG 2.2 AA accessibility with paired data-table alternatives for map/chart islands — Derived from: research §Pedagogy & Credibility, §Scenario B Implementation Details
* Azure Static Web Apps + GitHub Actions CI/CD for org alignment — Derived from: research §Scenario D Preferred Approach

## Context Summary

### Project Files

* README.md - Greenfield workspace; only existing file; no stack or conventions to preserve
* .copilot-tracking/research/2026-06-13/shark-education-site-research.md - Primary research: selected architecture, data sources, IA, schema, pedagogy, technical scenarios, decision points

### References

* .copilot-tracking/research/subagents/2026-06-13/shark-data-sources-research.md - Authoritative APIs/sources, auth, licensing, species counts, anchor references
* .copilot-tracking/research/subagents/2026-06-13/web-tech-stack-research.md - Recommended stack, sample directory tree, content.config.ts
* .copilot-tracking/research/subagents/2026-06-13/content-pedagogy-research.md - Dual-track IA, per-species JSON schema, engagement features, pedagogy, citation style
* [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) - defineCollection(), Zod schema, reference(), getCollection()
* [Azure Static Web Apps deploy action](https://github.com/Azure/static-web-apps-deploy) - GitHub Actions deployment

### Standards References

* No .github/copilot-instructions.md present; org context (devopsabcs-engineering) signals Azure + GitHub Actions alignment

## Implementation Checklist

### [x] Implementation Phase 1: Project Scaffold and Build Tooling

<!-- parallelizable: false -->

* [x] Step 1.1: Initialize Astro project with static output and core integrations
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 12-34)
* [x] Step 1.2: Configure astro.config.mjs, package.json scripts, base styles, and project tree
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 36-58)
* [x] Step 1.3: Validate scaffold build
  * Run `npm install` and `npm run build`; confirm a clean static `dist/` output

### [x] Implementation Phase 2: Content Model and Schemas

<!-- parallelizable: false -->

* [x] Step 2.1: Define content.config.ts collections and Zod schemas (species, families, lessons, citations)
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 60-83)
* [x] Step 2.2: Encode sourced-value object pattern, external authority IDs, and record/review metadata
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 85-110)
* [x] Step 2.3: Validate schemas against one sample species entry
  * Run `npm run build`; confirm Zod validation passes for a seed MDX/JSON entry

### [x] Implementation Phase 3: Build-Time Data Ingestion Pipeline

<!-- parallelizable: true -->

* [x] Step 3.1: Implement scripts/fetch-occurrences.mjs for GBIF + OBIS occurrences
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 112-134)
* [x] Step 3.2: Fetch and simplify IUCN range polygons (or no-token OBIS redlist fallback) to GeoJSON
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 136-161)
* [x] Step 3.3: Validate data pipeline output
  * Run the prebuild script for a seed species; confirm GeoJSON files appear in `public/data/`

### [x] Implementation Phase 4: Interactive Island Components

<!-- parallelizable: true -->

* [x] Step 4.1: Build DistributionMap (MapLibre + deck.gl) with paired data-table alternative
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 163-184)
* [x] Step 4.2: Build SpeciesExplorer, ConservationChart, SizeComparison/DepthZones, Quiz, IdentificationKey, and pathway/engagement islands
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 186-224)
* [x] Step 4.3: Validate island hydration and bundle budget
  * Run `npm run build`; confirm islands use `client:*` directives, non-interactive pages ship ~zero JS, and the deck.gl map island stays within its JS bundle budget (e.g., ≤250 KB gzipped, lazy-loaded)

### [x] Implementation Phase 5: Layouts, Pages and Information Architecture

<!-- parallelizable: false -->

* [x] Step 5.1: Build BaseLayout/SpeciesLayout with SEO meta, JSON-LD, and a11y skip-links
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 226-244)
* [x] Step 5.2: Build dynamic routes and IA pages (species, explore, map, lessons, search, pathways, careers, toolkit)
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 246-280)
* [x] Step 5.3: Validate routing and page generation
  * Run `npm run build`; confirm one page per species via getStaticPaths and Pagefind index builds

### [x] Implementation Phase 6: Launch Content Seed Set

<!-- parallelizable: true -->

* [x] Step 6.1: Author flagship species entries (one per living order) with full per-fact citations
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 282-303)
* [x] Step 6.2: Author foundational lessons, glossary, family nodes, pathway and careers content
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 305-332)
* [x] Step 6.3: Validate content integrity
  * Run `npm run build`; confirm citation references resolve and review badges render

### [x] Implementation Phase 7: CI/CD, Accessibility and SEO Gates

<!-- parallelizable: false -->

* [x] Step 7.1: Add Azure Static Web Apps + GitHub Actions workflow with PR previews
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 334-352)
* [x] Step 7.2: Wire accessibility (axe-core) and Lighthouse CI gates, sitemap, and JSON-LD
  * Details: .copilot-tracking/details/2026-06-13/shark-education-site-details.md (Lines 354-376)

### [x] Implementation Phase N: Validation

<!-- parallelizable: false -->

* [x] Step N.1: Run full project validation
  * Execute `npm run build`, `npm run lint` (if configured), axe-core, and Lighthouse CI
* [x] Step N.2: Fix minor validation issues
  * Iterate on lint errors, build warnings, broken citation references, and accessibility findings
* [x] Step N.3: Report blocking issues
  * Document issues needing additional research (licensing confirmation, telemetry data terms); provide next steps rather than large-scale inline fixes

## Planning Log

See .copilot-tracking/plans/logs/2026-06-13/shark-education-site-log.md for discrepancy tracking, implementation paths considered, decision points, and suggested follow-on work.

## Dependencies

* Node.js 20+ and npm
* Astro + integrations (@astrojs/mdx, @astrojs/sitemap, @astrojs/preact, astro-pagefind)
* MapLibre GL JS, deck.gl, Observable Plot, D3, Fuse.js
* Pagefind, Sharp (via Astro Image)
* Azure Static Web Apps Free tier + GitHub Actions (deployment token configured at setup)
* Open data APIs: WoRMS, OBIS, GBIF (no auth for reads); IUCN Red List v4 token and CITES Species+ token (sign-up) for conservation enrichment

## Success Criteria

* Astro static site builds cleanly with islands hydrating only interactive widgets — Traces to: research §Scenario A
* Zod-validated content collections enforce the per-fact sourced-value schema and external authority IDs — Traces to: research §Implementation Patterns
* Build-time pipeline produces static GeoJSON occurrence/range data with no runtime API dependency — Traces to: research §Implementation Patterns ("build-time data baking")
* Distribution map, species explorer, conservation chart, size/depth visualizers, and quiz function with paired accessible alternatives — Traces to: research §Engaging Interactive Features, §Scenario B
* Dual-track IA with Scuba and Filmmaking pathways is navigable and cross-links biology/species — Traces to: research §Recommended Information Architecture
* Launch seed set (flagship species per order) carries full per-fact citations and expert-review badges — Traces to: research §Recommended Next Steps step 7
* Azure Static Web Apps + GitHub Actions deploys with PR preview environments — Traces to: research §Scenario D
* Site meets WCAG 2.2 AA via automated gates and paired data-table alternatives — Traces to: research §Pedagogy & Credibility
