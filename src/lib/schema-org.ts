/**
 * schema-org.ts
 * JSON-LD builder stubs for FinFacts structured data.
 *
 * These typed helpers return schema.org JSON-LD objects to embed in page
 * <head> via <script type="application/ld+json">. They are intentionally
 * minimal stubs in Phase 1 and are expanded as content/layout phases land.
 *
 * @see https://schema.org/LearningResource
 * @see https://schema.org/Article
 */

/** Minimal shape of a schema.org JSON-LD node. */
export interface JsonLd {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

export interface LearningResourceInput {
  /** Resource name / title. */
  name: string;
  /** Canonical absolute URL of the resource. */
  url: string;
  /** Short description / summary. */
  description?: string;
  /** Intended educational audience, e.g. "undergraduate marine biology". */
  educationalAudience?: string;
  /** Learning level, e.g. "beginner" or "intermediate". */
  educationalLevel?: string;
  /** Keywords / subjects covered. */
  keywords?: string[];
  /** Language code (BCP-47), e.g. "en". */
  inLanguage?: string;
}

/**
 * Build a schema.org LearningResource JSON-LD object.
 * Used for lessons and species pages that act as educational resources.
 */
export function buildLearningResource(input: LearningResourceInput): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: input.name,
    url: input.url,
  };

  if (input.description) node.description = input.description;
  if (input.educationalAudience) {
    node.educationalAudience = {
      '@type': 'EducationalAudience',
      educationalRole: input.educationalAudience,
    };
  }
  if (input.educationalLevel) node.educationalLevel = input.educationalLevel;
  if (input.keywords?.length) node.keywords = input.keywords.join(', ');
  if (input.inLanguage) node.inLanguage = input.inLanguage;

  return node;
}

export interface ArticleInput {
  /** Article headline / title. */
  headline: string;
  /** Canonical absolute URL of the article. */
  url: string;
  /** Short description / summary. */
  description?: string;
  /** Author display name(s). */
  author?: string | string[];
  /** ISO 8601 publish date. */
  datePublished?: string;
  /** ISO 8601 last-modified date. */
  dateModified?: string;
  /** Absolute image URL(s) for the article. */
  image?: string | string[];
  /** Language code (BCP-47), e.g. "en". */
  inLanguage?: string;
}

/**
 * Build a schema.org Article JSON-LD object.
 * Used for long-form lessons and editorial content.
 */
export function buildArticle(input: ArticleInput): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    url: input.url,
  };

  if (input.description) node.description = input.description;
  if (input.author) {
    const authors = Array.isArray(input.author) ? input.author : [input.author];
    node.author = authors.map((name) => ({ '@type': 'Person', name }));
  }
  if (input.datePublished) node.datePublished = input.datePublished;
  if (input.dateModified) node.dateModified = input.dateModified;
  if (input.image) node.image = input.image;
  if (input.inLanguage) node.inLanguage = input.inLanguage;

  return node;
}

export interface WebSiteInput {
  /** Site name. */
  name: string;
  /** Canonical absolute site URL. */
  url: string;
  /** Short site description. */
  description?: string;
  /** Language code (BCP-47), e.g. "en". */
  inLanguage?: string;
}

/**
 * Build a schema.org WebSite JSON-LD object for the site homepage.
 * Helps search engines associate the canonical name and URL with the site.
 */
export function buildWebSite(input: WebSiteInput): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
  };

  if (input.description) node.description = input.description;
  if (input.inLanguage) node.inLanguage = input.inLanguage;

  return node;
}

/** Serialize a JSON-LD node for inline embedding in a <script> tag. */
export function serializeJsonLd(node: JsonLd): string {
  return JSON.stringify(node);
}
