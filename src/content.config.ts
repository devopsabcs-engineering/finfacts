/**
 * Astro Content Layer configuration for FinFacts.
 *
 * Defines four collections — `species`, `families`, `lessons`, and `citations` —
 * with Zod schemas and cross-collection {@link reference} links.
 *
 * Credibility is operationalized at the data layer: every non-trivial factual
 * field is modelled as a *sourced-value object* — `{ value, unit?, sources,
 * confidence?, asOf }` — where `sources` is an array of references into the
 * central `citations` collection. Bare scalars are reserved for stable
 * identity, display, and structural fields only. This directly addresses
 * Planning-Log DD-01 (per-fact sourcing as the core credibility requirement).
 *
 * @see https://docs.astro.build/en/guides/content-collections/
 * @see https://docs.astro.build/en/reference/content-loader-reference/
 */

import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* -------------------------------------------------------------------------- */
/* Shared vocabularies                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Evidence-strength tag rendered alongside facts so readers can weigh claims.
 * Aligns with the "well-established / emerging / contested" framing from the
 * content-pedagogy research (evidence-level callouts).
 */
const confidenceLevel = z.enum(['well-established', 'emerging', 'contested']);

/** IUCN Red List category codes (v4 vocabulary). */
const iucnCategory = z.enum(['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE']);

/** A scalar fact that may legitimately be a number or a textual range (e.g. "2-10"). */
const numberOrRange = z.union([z.number(), z.string()]);

/* -------------------------------------------------------------------------- */
/* Sourced-value helpers (the credibility primitive)                          */
/* -------------------------------------------------------------------------- */

/**
 * Build a Zod schema for a sourced-value object wrapping `valueSchema`.
 *
 * Shape: `{ value, unit?, sources, confidence?, asOf? }`. `sources` resolves to
 * entries in the `citations` collection. Use this for any quantitative or
 * categorical fact that needs attribution.
 *
 * @example
 *   maxTotalLength: sourcedValue(z.number()) // { value: 600, unit: 'cm', sources: ['fishbase'] }
 */
const sourcedValue = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    value: valueSchema,
    unit: z.string().optional(),
    sources: z.array(reference('citations')).default([]),
    confidence: confidenceLevel.optional(),
    asOf: z.string().optional(),
  });

/**
 * Sourced free-text statement: `{ text, sources, confidence?, asOf? }`.
 * The textual analogue of {@link sourcedValue} for prose facts and notes.
 */
const sourcedText = () =>
  z.object({
    text: z.string(),
    sources: z.array(reference('citations')).default([]),
    confidence: confidenceLevel.optional(),
    asOf: z.string().optional(),
  });

/** Convenience: a bare list of citation references (no wrapping value). */
const citationRefs = () => z.array(reference('citations')).default([]);

/* -------------------------------------------------------------------------- */
/* Reusable sub-objects                                                       */
/* -------------------------------------------------------------------------- */

/** A vernacular name with language tag and attribution. */
const commonName = z.object({
  name: z.string(),
  lang: z.string().default('en'),
  preferred: z.boolean().optional(),
  sources: citationRefs(),
});

/** A subject-matter reviewer for the "Scientifically reviewed by …" badge. */
const reviewer = z.object({
  name: z.string(),
  credentials: z.string().optional(),
  affiliation: z.string().optional(),
  orcid: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, 'ORCID must be formatted 0000-0000-0000-0000')
    .optional(),
});

/**
 * Record & review metadata: content dating plus the taxonomic-authority
 * snapshot version so readers know how current the names/status are.
 */
const recordMeta = z.object({
  created: z.coerce.date(),
  lastUpdated: z.coerce.date(),
  lastReviewed: z.coerce.date().optional(),
  reviewedBy: z.array(reviewer).default([]),
  taxonomicAuthorityVersion: z.string().optional(),
});

/**
 * External authority identifiers. WoRMS AphiaID is the **required** primary
 * stable join key; all others are optional enrichment keys. `null` is allowed
 * (meaning "checked, not assigned") so records never fabricate IDs.
 */
const externalIds = z.object({
  /** WoRMS AphiaID — primary stable authority key (required). */
  wormsAphiaId: z.number().int().positive(),
  eschmeyerCofId: z.number().int().positive().nullable().optional(),
  fishbaseSpecCode: z.number().int().positive().nullable().optional(),
  iucnTaxonId: z.number().int().positive().nullable().optional(),
  gbifTaxonKey: z.number().int().positive().nullable().optional(),
  inaturalistTaxonId: z.number().int().positive().nullable().optional(),
  itisTsn: z.number().int().positive().nullable().optional(),
});

/** Linnaean rank strings for display; the canonical parent link is the top-level `family` reference. */
const taxonomy = z.object({
  class: z.string().default('Chondrichthyes'),
  subclass: z.string().optional(),
  superorder: z.string().optional(),
  order: z.string(),
  family: z.string(),
  genus: z.string(),
  species: z.string(),
  sources: citationRefs(),
});

/** Display identity: scientific name, authorship, vernaculars, pronunciation. */
const identity = z.object({
  scientificName: z.string(),
  authorship: z.string().optional(),
  commonNames: z.array(commonName).default([]),
  pronunciation: z
    .object({
      ipa: z.string().optional(),
      audioUrl: z.string().optional(),
    })
    .optional(),
});

/** Conservation status. `iucn` (with category) is required; the rest is enrichment. */
const conservation = z.object({
  iucn: z.object({
    category: iucnCategory,
    categoryLabel: z.string().optional(),
    criteria: z.string().optional(),
    populationTrend: z.enum(['increasing', 'stable', 'decreasing', 'unknown']).optional(),
    assessmentYear: z.number().int().optional(),
    assessmentUrl: z.string().url().optional(),
    assessmentDoi: z.string().nullable().optional(),
    sources: citationRefs(),
  }),
  citesAppendix: sourcedValue(z.enum(['I', 'II', 'III', 'NL'])).optional(),
  majorThreats: z.array(sourcedText()).default([]),
});

const morphology = z
  .object({
    size: z
      .object({
        maxTotalLength: sourcedValue(z.number()).optional(),
        commonTotalLength: sourcedValue(z.number()).optional(),
        maxMass: sourcedValue(z.number()).optional(),
        lengthMeasurementType: z
          .enum(['total_length', 'fork_length', 'precaudal_length', 'standard_length', 'disc_width'])
          .optional(),
      })
      .optional(),
    identificationFeatures: z.array(sourcedText()).default([]),
    denticles: sourcedText().optional(),
  })
  .optional();

const biology = z
  .object({
    diet: z
      .object({
        summary: sourcedText().optional(),
        trophicLevel: sourcedValue(z.number()).optional(),
      })
      .optional(),
    reproduction: z
      .object({
        mode: sourcedValue(z.string()).optional(),
        litterSize: sourcedValue(numberOrRange).optional(),
        gestationMonths: sourcedValue(numberOrRange).optional(),
        ageAtMaturityYears: z
          .object({
            female: z.number().optional(),
            male: z.number().optional(),
            sources: citationRefs(),
          })
          .optional(),
      })
      .optional(),
    ageAndGrowth: z
      .object({
        maxAgeYears: sourcedValue(z.number()).optional(),
      })
      .optional(),
    physiologyNotes: z.array(sourcedText()).default([]),
  })
  .optional();

const distribution = z
  .object({
    habitat: sourcedText().optional(),
    depthRangeM: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
        typicalMin: z.number().optional(),
        typicalMax: z.number().optional(),
        sources: citationRefs(),
      })
      .optional(),
    temperatureRangeC: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
        sources: citationRefs(),
      })
      .optional(),
    rangeRegions: z.array(z.string()).default([]),
    rangeMapUrl: z.string().url().optional(),
    occurrenceDataset: z
      .object({
        gbif: z.string().url().optional(),
        obis: z.string().url().optional(),
        inaturalist: z.string().url().optional(),
      })
      .optional(),
  })
  .optional();

const humanInteraction = z
  .object({
    riskToHumans: z
      .object({
        isafImplicated: z.boolean().optional(),
        context: sourcedText().optional(),
      })
      .optional(),
  })
  .optional();

/** Scuba sub-audience overlay so pathway pages can query the same dataset. */
const diving = z
  .object({
    commonlyEncountered: z.boolean().optional(),
    encounterRegions: z.array(z.string()).default([]),
    typicalEncounterDepthM: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    cageDivingCommon: z.boolean().optional(),
    certificationLevel: z.string().optional(),
    behaviorNotes: z.array(sourcedText()).default([]),
    ethicsNotes: z.string().optional(),
    exemplarSites: z
      .array(
        z.object({
          name: z.string(),
          region: z.string().optional(),
          season: z.string().optional(),
          sources: citationRefs(),
        }),
      )
      .default([]),
  })
  .optional();

/** Underwater-filmmaking sub-audience overlay. */
const filming = z
  .object({
    frequentlyFilmed: z.boolean().optional(),
    notableFootage: z
      .array(
        z.object({
          title: z.string(),
          year: z.number().int().optional(),
          url: z.string().url().optional(),
          sources: citationRefs(),
        }),
      )
      .default([]),
    filmingNotes: z.string().optional(),
    recommendedGear: z.array(z.string()).default([]),
    ambientLightDepthM: sourcedValue(z.number()).optional(),
    baitingControversy: sourcedText().optional(),
    ethicsChecklist: z.array(z.string()).default([]),
  })
  .optional();

const media = z
  .object({
    images: z
      .array(
        z.object({
          url: z.string(),
          alt: z.string(),
          credit: z.string().optional(),
          license: z.string().optional(),
          sourceUrl: z.string().url().optional(),
        }),
      )
      .default([]),
    video: z
      .array(
        z.object({
          url: z.string(),
          captionsUrl: z.string().optional(),
          transcriptUrl: z.string().optional(),
          credit: z.string().optional(),
          license: z.string().optional(),
        }),
      )
      .default([]),
    audioPronunciationUrl: z.string().optional(),
  })
  .optional();

const evidence = z
  .object({
    overallConfidence: confidenceLevel.optional(),
    openQuestions: z.array(sourcedText()).default([]),
  })
  .optional();

/* -------------------------------------------------------------------------- */
/* Collections                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `species` — one MDX file per shark species. Required core: identity,
 * externalIds (AphiaID), taxonomy, the `family` reference, and conservation.iucn.
 * Richer biology / distribution / diving / filming blocks are progressively
 * populated and remain optional so 500+ species can scale without fabrication.
 */
const species = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/species' }),
  schema: z.object({
    schemaVersion: z.string().default('1.0.0'),
    record: recordMeta,
    identity,
    externalIds,
    taxonomy,
    /** Canonical taxonomic parent — cross-collection link to `families`. */
    family: reference('families'),
    conservation,
    morphology,
    biology,
    distribution,
    humanInteraction,
    diving,
    filming,
    media,
    evidence,
    /** Page-level references (in addition to per-fact `sources`). */
    citations: citationRefs(),
    relatedSpecies: z.array(reference('species')).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * `families` — taxonomy nodes (one JSON file per family). Used as the reference
 * target for `species.family` and for family landing pages.
 */
const families = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/families' }),
  schema: z.object({
    scientificName: z.string(),
    commonName: z.string().optional(),
    authorship: z.string().optional(),
    class: z.string().default('Chondrichthyes'),
    subclass: z.string().optional(),
    superorder: z.string().optional(),
    order: z.string(),
    description: sourcedText().optional(),
    speciesCount: sourcedValue(z.number()).optional(),
    externalIds: z
      .object({
        wormsAphiaId: z.number().int().positive().optional(),
        gbifTaxonKey: z.number().int().positive().optional(),
      })
      .optional(),
    sources: citationRefs(),
  }),
});

/**
 * `lessons` — scaffolded curriculum and pathway content (one MD/MDX file each).
 * Links to the species it teaches and the citations backing its claims.
 */
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    summary: z.string().optional(),
    pathway: z.enum(['learn', 'scuba', 'filming']).default('learn'),
    audience: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    order: z.number().optional(),
    created: z.coerce.date(),
    lastUpdated: z.coerce.date().optional(),
    lastReviewed: z.coerce.date().optional(),
    reviewedBy: z.array(reviewer).default([]),
    relatedSpecies: z.array(reference('species')).default([]),
    citations: citationRefs(),
    draft: z.boolean().default(false),
  }),
});

/**
 * `citations` — the central reference store (one JSON file per source; the
 * filename is the citation id used by every `sources` array). Holds full
 * bibliographic data with DOIs, URLs, and accessed-dates for CSE name-year
 * rendering via `src/lib/citations.ts`.
 */
const citations = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/citations' }),
  schema: z.object({
    type: z
      .enum([
        'database',
        'dataset',
        'assessment',
        'report',
        'article',
        'book',
        'chapter',
        'website',
        'thesis',
        'video',
      ])
      .default('website'),
    authors: z.array(z.string()).default([]),
    year: z.number().int().nullable().optional(),
    title: z.string(),
    /** Journal, book, or database/site name (CSE "container"). */
    container: z.string().optional(),
    publisher: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    edition: z.string().optional(),
    editors: z.array(z.string()).default([]),
    doi: z.string().nullable().optional(),
    url: z.string().url().nullable().optional(),
    accessedDate: z.coerce.date().optional(),
    license: z.string().optional(),
    note: z.string().optional(),
  }),
});

export const collections = { species, families, lessons, citations };
