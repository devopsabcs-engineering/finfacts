# Research: Content Model, IA & Pedagogy for an Educational Shark Website (FinFacts)

Status: Complete

## Research Topics / Questions

1. Information architecture / site sections for first-year college marine biology students + serious HS students, with scuba and underwater-filming sub-audiences.
2. Evidence-grounded pedagogy and engagement design (active learning, inquiry, misconception correction, UDL).
3. Per-species data schema (concrete JSON) for 500+ species aligned to authoritative taxonomy, with per-fact citations.
4. Engaging interactive feature ideas with scientific grounding.
5. Scientific credibility practices (citation style, per-fact sourcing, expert review, dating, primary literature/DOIs).
6. Accessibility and inclusivity for the mixed audience.

## Authoritative Sources (verified during research)

### Taxonomy / species data (use as backbone authorities)

- [WoRMS — World Register of Marine Species](https://www.marinespecies.org/) — provides stable AphiaID per taxon, accepted classification, status (accepted/synonym), edit history, vernaculars, and per-fact source citations. Elasmobranchii AphiaID = 10193. WoRMS text is CC BY 4.0. Cite WoRMS with accessed-date.
- [Eschmeyer's Catalog of Fishes (California Academy of Sciences)](https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatmain.asp) — the nomenclatural authority for fish genera/species/references; WoRMS uses it as "basis of record."
- [Shark-References.com](https://shark-references.com/) (Pollerspöck & Straube, Bavarian State Collection of Zoology) — bibliography of recent + fossil chondrichthyans (>30,000 entries, DOIs, type database >6,200 entries), and a downloadable **List of Valid Extant Species** (versioned, e.g. Vers. 01/2026). Excellent for primary-literature linking.
- [FishBase](https://www.fishbase.se/) — morphometrics, ecology, common names, country occurrence; widely used; WoRMS pulls some elasmobranch data from FishBase.
- [Chondrichthyan Tree of Life / sharksrays.org](https://sharksrays.org/) and Naylor et al. molecular phylogeny work (Gavin Naylor, Florida Museum) — evolutionary relationships, orders/families.
- ~1,300+ described chondrichthyan species; subclass Elasmobranchii = sharks (Selachimorpha) + rays/batoids (Batoidea); plus Holocephali (chimaeras). Sharks alone ≈ 500+ species (the "500+ species" target maps to extant sharks; full chondrichthyan set is larger).

### Conservation status (authority)

- [IUCN SSC Shark Specialist Group (SSG)](https://www.iucnssg.org/) — leading authority on status of sharks, rays, chimaeras; has assessed all known species twice; publishes the 2024 Global Status Report, Important Shark and Ray Areas (ISRA), and the IUCN Red List categories.
- [IUCN Red List](https://www.iucnredlist.org/) — categories: EX, EW, CR, EN, VU, NT, LC, DD, NE. Use the coded category + assessment year + assessment DOI/URL per species.

### Misconception correction / risk statistics (authority)

- [International Shark Attack File (ISAF), Florida Museum of Natural History](https://www.floridamuseum.ufl.edu/shark-attacks/) — est. 1958, only scientifically-generated global database of shark bites (>6,800 investigations from the 1500s to present). Provides yearly worldwide summaries, "What are the Odds?", "Reducing Your Risk," "Species Implicated," and maps/data. 2024 had only 47 unprovoked bites worldwide (record low); 2025 returned to near-average. Use ISAF's own framing: "unprovoked bites," not "attacks," and contextualize risk.

### Citizen science programs (real participation hooks)

- [Shark Trust — Great Eggcase Hunt](https://www.sharktrust.org/great-eggcase-hunt) — citizen science recording empty eggcases (mermaid's purses); >600,000 records, 49 species from 30 countries; has an app, ID guides in many languages, beach + underwater (diver/snorkeller) recording. Strong model for scuba sub-audience.
- [Shark Trust — Great Shark Snapshot](https://www.sharktrust.org/the-great-shark-snapshot) and [Shark Log sightings database](https://www.sharktrust.org/sightings-database) — diver/snorkeller sighting submissions.
- [iNaturalist](https://www.inaturalist.org/) — general biodiversity observation platform; research-grade observations feed GBIF; ideal for species-ID practice and contributing real occurrence data.
- eShark / regional elasmobranch monitoring (e.g., ELMO South Africa, Project SIARC Wales) — diver-sourced elasmobranch sighting programs.

### Pedagogy / accessibility (authority)

- [CAST — Universal Design for Learning Guidelines 3.0 (2024)](https://udlguidelines.cast.org/) — three principles: Multiple Means of **Engagement** (interests & identities, effort & persistence, emotional capacity), **Representation** (perception, language & symbols, building knowledge), and **Action & Expression** (interaction, expression & communication, strategy development). Goal = "learner agency." Cite: CAST (2024).
- Active-learning evidence base: Freeman et al. (2014), *PNAS* 111(23):8410-8415, [doi:10.1073/pnas.1319030111](https://doi.org/10.1073/pnas.1319030111) — meta-analysis of 225 studies; active learning raised exam scores ~6% and cut STEM failure rates from 34% to 22%. (Foundational citation for choosing active over passive design.)
- Spaced repetition / retrieval practice: Roediger & Karpicke (2006) testing effect; Cepeda et al. (2006) spacing effect meta-analysis — basis for taxonomy flashcards/spaced quizzes.
- WCAG 2.2 (W3C) — web accessibility conformance target (AA). Reading-level guidance (e.g., aim core explanatory text near grade 8-10 readability for the mixed HS/college audience, with optional "deeper dive" expandable scientific detail).

## Findings

### 1. Recommended Information Architecture (IA)

Design around a **dual-track model**: a *Learn* spine (scaffolded curriculum) + a *Reference* spine (species database + glossary), with two *Pathways* overlays for the scuba and filming sub-audiences that resurface the same species/biology content through an applied lens. This satisfies UDL "multiple means of representation" and "optimize relevance/authenticity."

Top-level sections:

1. **Home / Onboarding** — audience selector ("I'm a HS student exploring," "I'm a first-year marine bio student," "I dive," "I film") that personalizes recommended pathways. Myth-busting hero (ISAF-grounded) to immediately correct the Jaws stereotype.
2. **Species Explorer (Reference database)** — searchable/filterable index of 500+ shark species; per-species pages (schema in §3). Filters: order/family, IUCN status, region/ocean basin, depth zone, max size, reproductive mode, "divers commonly encounter," "frequently filmed."
3. **Shark Biology Fundamentals** — anatomy (skeleton of cartilage, dermal denticles, fins), sensory systems (ampullae of Lorenzini/electroreception, lateral line, vision, olfaction, hearing), physiology (buoyancy via oily liver/lack of swim bladder, osmoregulation via urea/TMAO retention, ram vs buccal-pumping ventilation, countercurrent heat exchange in lamnids), reproduction modes (oviparity, viviparity, ovoviviparity/aplacental viviparity, placental viviparity, parthenogenesis), growth/age & longevity.
4. **Taxonomy & Evolution** — class Chondrichthyes; subclass Elasmobranchii (sharks + batoids) vs Holocephali (chimaeras); the ~8-9 living shark orders (Hexanchiformes, Squaliformes, Pristiophoriformes, Squatiniformes, Heterodontiformes, Orectolobiformes, Lamniformes, Carcharhiniformes) and families; 400+ million-year evolutionary history; relationship to rays and chimaeras; phylogenetic tree explorer.
5. **Ecology & Conservation** — trophic roles (apex/meso-predators, trophic cascades), life-history traits driving vulnerability (slow growth, late maturity, low fecundity), threats (overfishing, finning, bycatch, habitat loss, climate change), management tools (MPAs, ISRAs, CITES, RFMOs, finning bans), and citizen-science participation.
6. **Pathway: Scuba Diving with Sharks** — safety & risk in context, ethical/responsible diving practices, certifications (Open Water → AOW → specialty), reading shark behavior/body language, species commonly encountered by region, choosing reputable operators, and how diving feeds conservation data (eggcase/sighting recording).
7. **Pathway: Underwater Shark Filmmaking** — camera bodies & underwater housings, lenses/ports (wide-angle/dome vs macro), lighting/strobes & video lights, ambient vs artificial light, buoyancy & approach technique, ethics (no harassment, minimal disturbance), the **baiting/chumming controversy**, permits/permissions, getting started on a budget, and notable cinematographers/films as exemplars.
8. **Careers & Get Involved** — study pathways (HS course choices → undergrad marine biology/zoology/fisheries → grad), internships, research programs, volunteering, citizen science (Great Eggcase Hunt, Great Shark Snapshot, iNaturalist), professional societies, and "day in the life" profiles.
9. **Toolkit (cross-cutting)** — Glossary with pronunciation guides, Interactive ID key, Data Explorer, Quizzes/self-assessment, Citations & Methods page, "How we know what we know" (epistemology of science).

Navigation principle: every biology/ecology concept page deep-links to exemplar species pages, and every species page surfaces "related biology," "where divers see it," and "notable footage" so the three audiences continuously cross-pollinate.

### 2. Pedagogy & Engagement Design (evidence-grounded)

Anchor the whole design in **active learning** (Freeman et al. 2014) and **UDL 3.0** (CAST 2024). Concrete moves:

- **Active learning over passive reading**: every concept page ends with a low-stakes interactive (predict-then-reveal, drag-to-label anatomy, "spot the species" ID). Freeman et al. show this measurably improves outcomes and reduces failure.
- **Retrieval practice + spaced repetition for taxonomy**: a built-in flashcard/quiz engine (orders→families→genera, common↔scientific names, ID features) with spaced scheduling (Leitner/SM-2-style). Grounded in the testing effect (Roediger & Karpicke) and spacing effect (Cepeda et al.).
- **Inquiry-based & case studies**: "investigate a real question" modules (e.g., "Are white shark populations recovering off California?") that walk students through a dataset, hypothesis, and interpretation — UDL Guideline 3 (building knowledge) and 8 (sustaining effort).
- **Data literacy**: let students explore real datasets (ISAF yearly summaries, OCEARCH-style tracking, IUCN status trends, eggcase records) with guided prompts; teach reading axes, sample size, uncertainty.
- **Misconception correction (responsible)**: present the Jaws myth vs evidence using ISAF data and framing — emphasize *unprovoked bites* terminology, base rates ("What are the Odds?"), that most species are harmless to humans, and that sensational media skews perception. Use a *refutation-text* pattern (state misconception → flag it as false → give correct model → explain why the misconception is appealing), which is the evidence-based way to correct misconceptions without reinforcing them. Avoid fear-mongering imagery; pair risk facts with risk-reduction guidance (ISAF "Reducing Your Risk").
- **Tiered depth (mixed HS/college)**: each page has a concise core explanation (≈grade 8-10) plus expandable "Going deeper" panels with college-level mechanism, primary-literature links, and quantitative detail — UDL "optimize challenge and support" (8.2) and "support decoding" (2.2).
- **Relevance & identity (engagement)**: the scuba/filming pathways and career profiles provide authentic, identity-relevant entry points (UDL 7.1-7.2), increasing motivation for the exact sub-audiences specified.
- **Feedback & progress**: action-oriented feedback on quizzes (UDL 8.5), visible progress/mastery indicators, and optional badges for completing pathways or contributing citizen-science records.

### 3. Per-Species Data Schema

See dedicated section "Per-Species JSON Schema Draft" below. Key design decisions:

- **Authoritative IDs first**: every species record keys to external authority IDs (WoRMS AphiaID as primary stable key; plus Eschmeyer CoF, FishBase SpecCode, IUCN taxon ID, GBIF key, iNaturalist taxon ID). This makes the data verifiable, updatable, and de-duplicated.
- **Per-fact citations**: every non-trivial factual field is an object `{ value, unit?, sources:[citationId], confidence?, asOf }` rather than a bare scalar, so each claim links to a source and a date. A central `citations[]` array holds full reference objects (with DOI/URL).
- **Conservation status carries assessment metadata** (category code, year, criteria, population trend, assessment URL/DOI) — never a bare label.
- **Audience overlays**: explicit `diving` and `filming` sub-objects so pathway pages can query the same dataset.

### 4. Engaging Interactive Features (with scientific grounding)

| Feature | What it does | Scientific grounding / data source |
|---|---|---|
| **Interactive dichotomous ID key** | Step-through couplets (e.g., snout shape, fin position, denticles, teeth) to identify a shark to family/species | Mirrors real taxonomic keys (e.g., FAO/Elasmo-Key, [elasmo-key.org](https://elasmo-key.org/)); teaches authentic ID skill used in field surveys |
| **Size & depth comparison visualizer** | Scale a chosen species against a human diver, other sharks, and a depth column showing its vertical range | Uses `size.maxTotalLength` and `depthRangeM` fields; teaches morphometrics + vertical habitat |
| **Migration / tracking map** | Animated tracks and range polygons per species/population | OCEARCH and tagging datasets; IUCN range maps; teaches movement ecology & MPAs |
| **Conservation-status dashboard** | Filter/sort species by IUCN category, trend, region; show % threatened by order/family | IUCN Red List + SSG 2024 Global Status Report; teaches data literacy + conservation |
| **Spaced-repetition taxonomy trainer** | Flashcards/quizzes scheduled over time for orders/families/names/ID features | Testing + spacing effect (Roediger & Karpicke; Cepeda et al.) |
| **"Build a dive plan"** | Pick a region/season → see species likely encountered, depth/cert needed, operator considerations, behavior to expect, and how to log sightings | Ties `diving` overlay + range/depth + citizen-science recording (Great Eggcase Hunt / Shark Log) |
| **"Plan a shoot"** | Pick a target species/location → recommended gear (housing, lens/port, lighting), ambient-light depth, ethics checklist, permit reminders | Ties `filming` overlay; teaches optics + ethics + the baiting debate |
| **Glossary + pronunciation** | Hover/tap any scientific term for definition + audio pronunciation of binomials (e.g., *Carcharodon carcharias*) | UDL 2.1 clarify vocabulary; reduces barrier of Latin/Greek nomenclature |
| **"What are the odds?" risk explainer** | Interactive comparison of shark-bite risk vs everyday risks, with real ISAF numbers | ISAF "What are the Odds?"; responsible misconception correction |
| **Citizen-science contribution hub** | Submit eggcase finds, dive sightings, or iNaturalist observations directly | Great Eggcase Hunt, Shark Log, iNaturalist; authentic participation |

### 5. Scientific Credibility Practices

- **Citation style**: use **CSE (Council of Science Editors), name-year** as the primary scholarly style for a biology audience (CSE is the science-discipline standard); optionally offer APA toggle for education/social-science readers. Render in-text as `(Author Year)` linking to a full reference with **DOI** where available.
- **Per-fact sourcing**: store sources at the *fact* level (schema §3), not just a page-level bibliography, so each claim is traceable. Surface a small "source" affordance next to facts.
- **"Reviewed by" expert model**: each page carries `reviewedBy` (name, credentials, affiliation, ORCID) and `lastReviewed` date; show a visible "Scientifically reviewed by … on …" badge. Recruit reviewers via SSG / academic partners.
- **Dating content**: every page shows `created`, `lastUpdated`, and `lastReviewed`; species records carry `asOf` per fact and authority `accessedDate`.
- **Established vs ongoing science**: tag claims with a `confidence`/`evidenceLevel` (e.g., "well-established," "emerging," "contested") and use explicit callouts ("Active research question") so students learn that science is provisional — directly serving the "how we know what we know" goal.
- **Primary-literature linking**: prefer linking DOIs to peer-reviewed sources (via shark-references.com, Eschmeyer CoF, IUCN assessments) over secondary blogs. Provide a per-page "Sources & further reading" with primary citations.
- **Taxonomic currency**: re-sync names/status against WoRMS + Eschmeyer CoF on a schedule; store `taxonomicAuthorityVersion` so users know the snapshot date (e.g., shark-references "List of Valid Extant Species Vers. 01/2026").

### 6. Accessibility & Inclusivity

- **WCAG 2.2 AA** as the conformance target: semantic HTML, keyboard navigation, sufficient contrast, alt text for every image/diagram, captions/transcripts for video (essential for the filmmaking section), and no reliance on color alone for status (pair IUCN colors with labels/icons).
- **Reading levels (mixed audience)**: layered text — concise core text at ~grade 8-10, expandable college-level depth (UDL "challenge and support"). Provide a glossary tooltip on first use of every technical term.
- **Multilingual considerations**: design for i18n from the start (string externalization), prioritize a few high-impact languages; lean on the multilingual ID-guide model the Shark Trust uses (guides in Spanish, Greek, Turkish, Arabic, etc.). Use scientific (Latin) binomials as the language-independent anchor.
- **Multiple means of representation** (UDL): pair text with diagrams, photos, video, and audio (pronunciation); offer dark mode and adjustable text size.
- **Inclusive framing**: profile a diverse range of scientists/divers/filmmakers in careers content (UDL 1.3 "represent a diversity of perspectives and identities"); avoid Western-only examples and acknowledge Indigenous and local ecological knowledge where relevant.
- **Low-bandwidth / device range**: progressive enhancement so core content (species facts, text) works without heavy interactives; lazy-load maps/video.

## Per-Species JSON Schema Draft

A pragmatic schema for 500+ species. Pattern: factual fields are **sourced-value objects** `{ value, unit?, sources, confidence?, asOf }`; a central `citations[]` array holds full references; external authority IDs anchor identity and verifiability.

```jsonc
{
  "$schema": "https://finfacts.example/schemas/shark-species.v1.json",
  "id": "carcharodon-carcharias",            // internal slug (stable, URL-safe)
  "schemaVersion": "1.0.0",
  "record": {
    "created": "2026-06-13",
    "lastUpdated": "2026-06-13",
    "lastReviewed": "2026-06-13",
    "reviewedBy": [
      { "name": "Dr. Jane Doe", "credentials": "PhD", "affiliation": "Univ. X", "orcid": "0000-0000-0000-0000" }
    ],
    "taxonomicAuthorityVersion": "shark-references List of Valid Extant Species Vers. 01/2026; WoRMS accessed 2026-06-13"
  },

  "identity": {
    "scientificName": "Carcharodon carcharias",
    "authorship": "(Linnaeus, 1758)",         // describer + year
    "commonNames": [
      { "name": "Great white shark", "lang": "en", "preferred": true, "sources": ["worms"] },
      { "name": "Requin blanc", "lang": "fr", "sources": ["fishbase"] }
    ],
    "pronunciation": {
      "ipa": "/ˌkɑːrkəˈroʊdɒn ˌkɑːrkəˈraɪ.əs/",
      "audioUrl": "/audio/carcharodon-carcharias.mp3"
    }
  },

  "externalIds": {
    "wormsAphiaId": 105838,                    // primary stable authority key
    "eschmeyerCofId": null,
    "fishbaseSpecCode": 751,
    "iucnTaxonId": 3855,
    "gbifTaxonKey": 2418892,
    "inaturalistTaxonId": 51480,
    "itisTsn": 159903
  },

  "taxonomy": {
    "class": "Chondrichthyes",
    "subclass": "Elasmobranchii",
    "superorder": "Selachimorpha",
    "order": "Lamniformes",
    "family": "Lamnidae",
    "genus": "Carcharodon",
    "species": "carcharias",
    "sources": ["worms", "eschmeyer-cof"]
  },

  "morphology": {
    "size": {
      "maxTotalLength": { "value": 600, "unit": "cm", "sources": ["fishbase"], "confidence": "well-established", "asOf": "2026" },
      "commonTotalLength": { "value": 480, "unit": "cm", "sources": ["fishbase"] },
      "maxMass": { "value": 1900, "unit": "kg", "sources": ["fishbase"], "confidence": "emerging" },
      "lengthMeasurementType": "total_length"
    },
    "identificationFeatures": [
      { "text": "Conical snout; large triangular serrated teeth; strong black eye.", "sources": ["iucn-assessment-3855"] },
      { "text": "Counter-shaded: grey dorsally, white ventrally with a sharp demarcation.", "sources": ["fishbase"] }
    ],
    "denticles": { "text": "Small, smooth dermal denticles reduce drag.", "sources": ["citation-anatomy-1"] }
  },

  "biology": {
    "diet": {
      "summary": { "text": "Pinnipeds, cetaceans, fishes, other sharks; ontogenetic shift from fish to marine mammals.", "sources": ["iucn-assessment-3855"] },
      "trophicLevel": { "value": 4.5, "unit": "dimensionless", "sources": ["fishbase"] }
    },
    "reproduction": {
      "mode": { "value": "aplacental_viviparity_oophagy", "sources": ["citation-repro-1"], "confidence": "well-established" },
      "litterSize": { "value": "2-10", "sources": ["iucn-assessment-3855"] },
      "gestationMonths": { "value": "12-18", "sources": ["citation-repro-1"], "confidence": "emerging" },
      "ageAtMaturityYears": { "female": 33, "male": 26, "sources": ["citation-age-1"] }
    },
    "ageAndGrowth": {
      "maxAgeYears": { "value": 70, "sources": ["citation-age-1"], "confidence": "emerging" }
    },
    "physiologyNotes": [
      { "text": "Regional endothermy (warm-bodied) via rete mirabile, enabling activity in cold water.", "sources": ["citation-physio-1"] }
    ]
  },

  "distribution": {
    "habitat": { "text": "Coastal and offshore, surface to ~1200 m; temperate and subtropical.", "sources": ["iucn-assessment-3855"] },
    "depthRangeM": { "min": 0, "max": 1200, "typicalMin": 0, "typicalMax": 250, "sources": ["fishbase"] },
    "temperatureRangeC": { "min": 5, "max": 24, "sources": ["fishbase"] },
    "rangeRegions": ["NE Pacific", "SW Pacific", "S Africa", "Mediterranean", "NW Atlantic"],
    "rangeMapUrl": "https://www.iucnredlist.org/species/3855/...",
    "occurrenceDataset": { "gbif": "https://www.gbif.org/species/2418892", "inaturalist": "https://www.inaturalist.org/taxa/51480" }
  },

  "conservation": {
    "iucn": {
      "category": "VU",                        // EX,EW,CR,EN,VU,NT,LC,DD,NE
      "categoryLabel": "Vulnerable",
      "criteria": "A2bd",
      "populationTrend": "decreasing",
      "assessmentYear": 2018,
      "assessmentUrl": "https://www.iucnredlist.org/species/3855/...",
      "assessmentDoi": null,
      "sources": ["iucn-ssg"]
    },
    "citesAppendix": { "value": "II", "sources": ["cites"] },
    "majorThreats": [
      { "text": "Bycatch in commercial fisheries.", "sources": ["iucn-assessment-3855"] },
      { "text": "Targeted fishing for jaws/teeth/fins historically.", "sources": ["iucn-assessment-3855"] }
    ]
  },

  "humanInteraction": {
    "riskToHumans": {
      "isafImplicated": true,
      "context": { "text": "One of three species most often involved in unprovoked bites, but bites remain extremely rare relative to exposure.", "sources": ["isaf"] }
    }
  },

  "diving": {                                   // scuba sub-audience overlay
    "commonlyEncountered": true,
    "encounterRegions": ["Guadalupe (historically)", "South Australia", "South Africa"],
    "typicalEncounterDepthM": { "min": 0, "max": 30 },
    "cageDivingCommon": true,
    "behaviorNotes": [
      { "text": "Curious, investigatory approaches; vertical body posture can signal agitation.", "sources": ["citation-behavior-1"] }
    ],
    "ethicsNotes": "Follow operator briefings; do not touch or feed; maintain respectful distance."
  },

  "filming": {                                  // underwater-filmmaking overlay
    "frequentlyFilmed": true,
    "notableFootage": [
      { "title": "Example documentary", "year": 2021, "url": "https://example.org/...", "sources": [] }
    ],
    "filmingNotes": "Wide-angle/dome port; ambient light to ~20 m; baiting raises ethical and behavioral-conditioning concerns.",
    "baitingControversy": { "text": "Chumming/baiting can alter natural behavior and is debated; some jurisdictions restrict it.", "sources": ["citation-baiting-1"] }
  },

  "media": {
    "images": [ { "url": "/img/gws-1.jpg", "credit": "Photographer Name", "license": "CC-BY-4.0", "alt": "Great white shark in clear blue water" } ],
    "video": [ { "url": "/video/gws.mp4", "captionsUrl": "/video/gws.vtt", "credit": "..." } ]
  },

  "evidence": {
    "overallConfidence": "well-established",
    "openQuestions": [
      { "text": "Lifespan estimates remain uncertain; bomb-radiocarbon ageing is ongoing.", "sources": ["citation-age-1"] }
    ]
  },

  "citations": [
    { "id": "worms", "type": "database", "title": "World Register of Marine Species — Carcharodon carcharias", "publisher": "WoRMS", "url": "https://www.marinespecies.org/aphia.php?p=taxdetails&id=105838", "accessedDate": "2026-06-13", "license": "CC-BY-4.0" },
    { "id": "eschmeyer-cof", "type": "database", "title": "Eschmeyer's Catalog of Fishes", "publisher": "California Academy of Sciences", "url": "https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatmain.asp", "accessedDate": "2026-06-13" },
    { "id": "fishbase", "type": "database", "title": "FishBase species summary — Carcharodon carcharias", "publisher": "FishBase", "url": "https://www.fishbase.se/summary/751", "accessedDate": "2026-06-13" },
    { "id": "iucn-ssg", "type": "report", "title": "IUCN SSC Shark Specialist Group assessments", "url": "https://www.iucnssg.org/", "accessedDate": "2026-06-13" },
    { "id": "iucn-assessment-3855", "type": "assessment", "title": "Carcharodon carcharias — IUCN Red List Assessment", "year": 2018, "url": "https://www.iucnredlist.org/species/3855/...", "doi": null },
    { "id": "isaf", "type": "database", "title": "International Shark Attack File", "publisher": "Florida Museum of Natural History", "url": "https://www.floridamuseum.ufl.edu/shark-attacks/", "accessedDate": "2026-06-13" },
    { "id": "citation-repro-1", "type": "article", "authors": "Author A, Author B", "year": 2020, "title": "...", "journal": "...", "doi": "10.xxxx/xxxxx" }
  ]
}
```

Schema notes:

- Scale to 500+ species by keeping required fields minimal (identity, externalIds, taxonomy, conservation.iucn) and treating richer biology/diving/filming as progressively populated. Validate with JSON Schema; allow `null`/absent for unknown facts (don't fabricate).
- The `sourced-value object` pattern (`{ value, sources, confidence, asOf }`) is the backbone of credibility — it operationalizes per-fact citation, dating, and established-vs-ongoing tagging.
- Use WoRMS AphiaID as the primary join key for re-syncing taxonomy; keep IUCN, GBIF, FishBase, iNaturalist IDs for cross-linking interactive features (maps, occurrence data, citizen science).

## Clarifying Questions

1. **Scope of "500+ species":** sharks only (~500+ extant sharks) or all chondrichthyans (sharks + rays/batoids + chimaeras, ~1,300+)? IA and schema can support either; default assumption used here is sharks-primary with optional rays/chimaeras expansion.
2. **Build/CMS context:** is FinFacts a static-site/JSON-driven app (so the JSON schema is authoritative) or backed by a CMS/DB? Affects whether the schema is the source of truth or a serialization.
3. **Data licensing/ingestion:** do you intend to ingest IUCN/FishBase/WoRMS data programmatically (license + API terms vary) or hand-curate with citations? IUCN and WoRMS have specific reuse terms.
4. **Expert reviewer pipeline:** is there an existing reviewer network, or should the design assume recruiting reviewers (affecting the "reviewed by" rollout)?
5. **Citizen-science integration depth:** embed/submit directly to partners (Great Eggcase Hunt, iNaturalist) via their APIs, or link out?
6. **Localization priority:** which languages first (drives i18n effort and which Shark Trust-style guides to mirror)?

## Recommended Next Research

- [ ] Verify IUCN Red List API / data-reuse terms and FishBase + WoRMS API access for programmatic species ingestion (licensing, rate limits, attribution).
- [ ] Pull the shark-references "List of Valid Extant Species" (current version) to get an authoritative count + family breakdown to size the database and ID-key couplets.
- [ ] Survey existing exemplar shark education sites (e.g., Florida Museum "Discover Fishes," Shark Trust, MarineBio, Save Our Seas) for IA patterns, gaps, and differentiation opportunities.
- [ ] Gather a concrete dichotomous-key source (FAO species catalogues / elasmo-key.org) to model the interactive ID key couplets.
- [ ] Compile authoritative gear/ethics references for the filmmaking section (e.g., marine-conservation filming codes of conduct, permit frameworks) and named cinematographers/films with verifiable sources.
- [ ] Source diving safety/ethics standards (e.g., agency shark-diving codes, Green Fins-style operator guidelines) for the scuba pathway.
- [ ] Define quiz/spaced-repetition data model and map it to the taxonomy fields in the species schema.
- [ ] Confirm reading-level targets and run sample copy through readability tooling; finalize WCAG 2.2 AA component checklist.
