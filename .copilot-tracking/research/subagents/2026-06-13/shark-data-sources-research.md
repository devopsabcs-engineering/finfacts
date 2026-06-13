# Shark Data Sources Research

Status: Complete (core APIs across all 6 areas; supplementary taxonomic catalogs noted as follow-ons)

Research scope: Authoritative scientific data sources, databases, and APIs about sharks (Chondrichthyes / Selachimorpha) to power an educational website covering all extant shark species. Audience: first-year marine biology undergraduates, serious high-school students, scuba divers, underwater shark filmmakers. Requirement: real, defensible, citable scientific sourcing.

## Research Questions

1. Authoritative taxonomy / species checklists (WoRMS, Catalog of Fishes, GBIF, FishBase, SharkReferences) — API access, coverage, license, extant species count, higher classification.
2. Conservation status (IUCN Red List API, CITES appendices, % threatened figure).
3. Occurrence / distribution / range (GBIF, OBIS, IUCN range maps, OCEARCH, Global Shark Movement Project).
4. Imagery / media legally usable for education (Wikimedia Commons, iNaturalist, NOAA Fisheries, EOL).
5. Authoritative organizations to cite/reference.
6. Key peer-reviewed references with DOIs.

For each API/source: base URL, auth/token, key endpoints, data format, license/terms, citation/attribution. Flag restrictive terms for educational (possibly non-commercial) use.

---

## 1. Taxonomy / Species Checklists

### WoRMS — World Register of Marine Species (recommended taxonomy backbone)

- REST docs: https://www.marinespecies.org/rest/ (OpenAPI: https://www.marinespecies.org/rest/api-docs/openapi.yaml)
- Base URL: `https://www.marinespecies.org/rest/<Operation>/<param>` — **no API key required**.
- Core identifier: **AphiaID** (stable per-name unique ID, backed by LSIDs) — use as cross-source join key.
- Key endpoints (all GET, JSON):
  - `/AphiaIDByName/{ScientificName}`; `/AphiaRecordByAphiaID/{ID}`; `/AphiaRecordsByName/{ScientificName}` (≤50)
  - `/AphiaRecordsByMatchNames` — TAXAMATCH fuzzy matching (Tony Rees algorithm)
  - `/AphiaClassificationByAphiaID/{ID}` — full higher classification (Kingdom→species)
  - `/AphiaChildrenByAphiaID/{ID}` (≤50); `/AphiaSynonymsByAphiaID/{ID}`; `/AphiaVernacularsByAphiaID/{ID}`
  - `/AphiaDistributionsByAphiaID/{ID}`; `/AphiaAttributesByAphiaID/{ID}` (traits); `/AphiaExternalIDByAphiaID/{ID}` (cross-links)
  - Batch: `/AphiaRecordsByAphiaIDs` (≤50)
- **License**: pages/text **CC-BY 4.0**; images default **CC BY-NC-SA 4.0**. Whole-DB redistribution requires written agreement.
- **Citation**: "WoRMS Editorial Board (2026). World Register of Marine Species. https://www.marinespecies.org at VLIZ. Accessed YYYY-MM-DD. doi:10.14284/170"
- For production, derive the live extant shark count from class Chondrichthyes → division Selachii rather than Wikipedia.

### GBIF Species API

- Docs: https://techdocs.gbif.org/en/openapi/ ; Base URL: `https://api.gbif.org/v1/...` (JSON, stable v1).
- `GET /species/match?name=...` returns GBIF `usageKey` + matched backbone classification; `GET /species/{key}`, `/species/search`.
- No auth for reads. Exposes external IDs (incl. WoRMS) for cross-walking. See §3 for occurrence usage and licensing.

### Wikipedia "List of sharks" (secondary, for sanity-check only)

- States **"557 described and 23 undescribed species in eight orders"** (https://en.wikipedia.org/wiki/List_of_sharks).
- 8 extant shark orders: Hexanchiformes, Squaliformes (Echinorhiniformes split by some authors), Pristiophoriformes, Squatiniformes, Heterodontiformes, Orectolobiformes, Lamniformes, Carcharhiniformes.

---

## 2. Conservation Status

### IUCN Red List API v4 (primary conservation source)

- Docs/Swagger: https://api.iucnredlist.org/api-docs (OpenAPI: https://api.iucnredlist.org/api-docs/v4/openapi.yaml)
- Base URL: `https://api.iucnredlist.org/api/v4/...`. **Token required** — register at https://api.iucnredlist.org/users/sign_up; bearer token.
- Key endpoints:
  - `GET /taxa/scientific_name?genus_name=&species_name=` — latest + historic assessments
  - `GET /taxa/sis/{sis_id}`; `GET /taxa/class/CHONDRICHTHYES` (taxon-level listings)
  - `GET /assessment/{assessment_id}`; `GET /red_list_categories/{code}` (LC, NT, VU, EN, CR, EW, EX, DD, NE)
  - `GET /systems/marine`, `/habitats/`, `/threats/`, `/countries/`; `GET /information/red_list_version`
- **Terms**: NON-COMMERCIAL only (research/education); commercial use forbidden (use IBAT). No scraping. Rate-limited — add delays, cache, refresh on new Red List version.
- **Citation**: "IUCN 2025. IUCN Red List of Threatened Species. Version 2025-2. www.iucnredlist.org"

### CITES — Species+ / CITES Checklist API (trade-regulation appendices)

- Docs: https://api.speciesplus.net/documentation ; Base URL: `https://api.speciesplus.net/api/v1/...` (JSON default; append `.xml` for XML).
- **Token required** — register at https://api.speciesplus.net/users/sign_up; pass header `X-Authentication-Token: <token>`.
- Key endpoints:
  - `GET /taxon_concepts` (list/search taxa)
  - `GET /taxon_concepts/:id/cites_legislation` — CITES appendix listings (I/II/III), reservations, quotas, suspensions
  - `GET /taxon_concepts/:id/eu_legislation`; `/distributions`; `/references`
  - `GET /downloads` — link to latest whole CITES/EU taxonomy bulk download
- Powered by UNEP-WCMC. Several shark spp. listed on CITES Appendix II (e.g., hammerheads, oceanic whitetip, porbeagle, makos, requiem sharks).

### Quick no-token shortcut

- OBIS `/checklist/redlist` and the `redlist_category` field (§3) surface IUCN categories for marine taxa without an IUCN token.

---

## 3. Occurrence / Distribution / Range

### OBIS — Ocean Biodiversity Information System (marine-focused, WoRMS-aligned)

- API/Swagger: https://api.obis.org/ (spec https://api.obis.org/obis_v3.yml); Base URL `https://api.obis.org` (v3 JSON). **No key**.
- Key endpoints:
  - `GET /occurrence` (+ `/occurrence/{id}`); `GET /occurrence/grid/{precision}`, `/occurrence/points`, `/occurrence/tile/{x}/{y}/{z}` (GeoJSON/MVT/KML)
  - `GET /taxon/{id|scientificname}`; `GET /checklist`, `/checklist/redlist`, `/checklist/newest`
  - `GET /statistics`, `/statistics/years`, `/statistics/composition`; `/facet`, `/dataset`, `/area`, `/country`
- Uses **Darwin Core**; marine/brackish/freshwater flags + taxonomy from **WoRMS**; records carry `AphiaID` and `redlist_category` → joins WoRMS + IUCN. Bulk: GeoParquet on AWS Open Data; R pkg `robis`.

### GBIF — occurrences (broadest coverage)

- Base URL `https://api.gbif.org/v1/`. Reads need no auth; downloads/POST use **HTTP Basic Auth** (free account).
- `GET /occurrence/search?...` (paging via `limit`+`offset`; repeatable params `?country=GB&country=IE`; ranges `?year=1800,1899`).
- Large/automated pulls → async download API `POST /occurrence/download/request` (≤100,000 params). Search APIs may return **HTTP 429**; set descriptive `User-Agent`.
- **Licensing**: per-dataset machine-readable **CC0 / CC-BY / CC-BY-NC**; cite via download DOI (https://www.gbif.org/citation-guidelines).

### Range maps

- IUCN range maps available via the Red List (spatial data downloads; same non-commercial terms as §2).

---

## 4. Imagery / Media (legally usable for education)

### Wikimedia Commons — MediaWiki Action API

- Endpoint: `https://commons.wikimedia.org/w/api.php` (no key for reads; send a descriptive `User-Agent`).
- `action=query&prop=imageinfo&iiprop=url|extmetadata|mime|size|user&titles=File:...&format=json`.
  - `extmetadata` returns license + attribution (e.g., `LicenseShortName`, `Artist`, `Credit`) — note: "expensive" prop, request a few at a time.
  - `iiurlwidth` for scaled thumbnails; sizes via URL manipulation.
- Generators: pull category members (e.g., shark species categories) then batch `imageinfo`. Most files CC-BY/CC-BY-SA/CC0/PD — **must surface per-file attribution + license**.

### iNaturalist API (v1)

- Docs/Swagger: https://api.inaturalist.org/v1/docs/ ; Base URL `https://api.inaturalist.org/v1/` (JSON, v1.3.0).
- `GET /taxa?q=...`, `GET /taxa/{id}` (incl. default photo); `GET /observations?taxon_id=...&photos=true&license=cc-by,cc-by-nc`.
- **Auth**: JWT (24 h) via OAuth at https://www.inaturalist.org/users/api_token — only needed for writes/private data; reads are open.
- **Rate limits**: ≤100 req/min (target ≤60), ≤10,000 req/day. NOT for scraping.
- **Photo licensing is per-photo**: open-licensed photos served from `inaturalist-open-data.s3.amazonaws.com` (also an AWS Open Dataset); photos on `static.inaturalist.org` are NOT openly licensed. Sizes: square/thumb/small/medium/large/original. Always check each photo's `license_code` and credit the observer.

### Encyclopedia of Life (EOL) — classic APIs

- Docs: https://eol.org/docs/what-is-eol/classic-apis ; Base `https://eol.org/api/...` (JSON/XML).
- `GET /api/search/1.0.json?q=<name>` → EOL page IDs; `GET /api/pages/1.0/{id}.json?details=true&images_per_page=...&licenses=cc-by,cc-by-nc,cc-by-sa,pd&common_names=true&references=true&taxonomy=true`.
- `licenses` filter (cc-by, cc-by-nc, cc-by-sa, cc-by-nc-sa, pd, na, all) lets you request only reusable media. Returns cross-hierarchy IDs (ITIS TSN, etc.). Optional `key` for higher rate limits. Hosted by Smithsonian.

### NOAA Fisheries

- Species pages/imagery are U.S. Government works (generally public domain) — good source for U.S. shark species; confirm credit per asset.

---

## 5. Authoritative Organizations to Cite/Reference

- **IUCN SSC Shark Specialist Group (SSG)** — global Red List assessments for chondrichthyans.
- **Flanders Marine Institute (VLIZ)** — hosts WoRMS; **OBIS** (UNESCO-IOC programme).
- **GBIF** (intergovernmental) — occurrence aggregation.
- **California Academy of Sciences — Eschmeyer's Catalog of Fishes** — nomenclatural authority for fishes (see follow-on).
- **FAO** — Compagno's *Sharks of the World* catalogues; fisheries data.
- **UNEP-WCMC / CITES** — trade listings (Species+).
- **Shark-References.com** (Hublin/Pollerspöck) — specialist chondrichthyan taxonomy + literature.
- **Smithsonian** (EOL host); **NOAA Fisheries** (U.S. management/imagery).

---

## 6. Key Peer-Reviewed References (with DOIs)

- Pacoureau, N. et al. (2021). "Half a century of global decline in oceanic sharks and rays." *Nature* 589: 567–571. doi:10.1038/s41586-020-03173-9 (≈71% decline since 1970).
- Dulvy, N.K. et al. (2021). "Overfishing drives over one-third of all sharks and rays toward a global extinction crisis." *Current Biology* 31(21): 4773–4787.e8. doi:10.1016/j.cub.2021.08.062.
- Dulvy, N.K. et al. (2014). "Extinction risk and conservation of the world's sharks and rays." *eLife* 3: e00590. doi:10.7554/eLife.00590 (~1/4 threatened).
- Compagno, L.J.V. (1984). *Sharks of the World* (FAO Species Catalogue). ISBN 978-92-5-104543-5 (foundational life-history/fecundity reference).
- Nelson, J.S. et al. (2016). *Fishes of the World*, 5th ed. ISBN 978-1-119-17484-4 (higher classification).

---

## Recommended Architecture for `finfacts`

- **Taxonomy/names** → WoRMS REST (AphiaID = universal join key; no auth).
- **Occurrences/range** → OBIS (marine, WoRMS-aligned) and/or GBIF (scale via async downloads).
- **Conservation** → IUCN Red List v4 (token; non-commercial; cache + refresh per version) + CITES Species+ (token) for trade status. OBIS `/checklist/redlist` as no-token fallback.
- **Media** → Wikimedia Commons + iNaturalist open-data + EOL (license-filtered) + NOAA (PD). Surface per-asset license/attribution.

## Practical Notes / Gotchas

- WoRMS / MediaWiki cap many results at 50 — batch carefully.
- GBIF search can 429; prefer async download API; send descriptive `User-Agent`.
- IUCN: token required, no scraping, **non-commercial only** — confirm project licensing.
- iNaturalist & Commons photos are **per-asset licensed** — never assume blanket reuse; credit creators.
- Confirm IUCN Red List version at runtime via `/information/red_list_version`.

## Follow-on Research (not completed)

- [ ] **Eschmeyer's Catalog of Fishes** (CAS) — definitive fish nomenclatural counts; check API/bulk access + terms.
- [ ] **Shark-References.com** — access terms / any programmatic API.
- [ ] **FishBase / SeaLifeBase** — traits, ecology, common names; `rfishbase` / Bohol Base API endpoints + license.
- [ ] Live WoRMS query for current extant Selachii species count (replace Wikipedia 557+23 figure for production).
- [ ] IUCN v4 token request flow + example authenticated request/response payload.
- [ ] GBIF `/species/match` exact response shape + `usageKey` → WoRMS external-ID mapping example.
- [ ] OCEARCH / Global Shark Movement Project — telemetry/tracking data access (mentioned in scope, not yet investigated).

## Clarifying Questions

- Is `finfacts` **commercial**? If yes, the IUCN Red List API is not permitted (would need IBAT) — confirm before relying on it.
- Confirm scope is **all extant sharks** (Selachii) vs. all chondrichthyans (incl. rays/chimaeras) — affects WoRMS query roots.
- Preferred runtime stack/language for API clients? (Workspace currently has only README.md.)
