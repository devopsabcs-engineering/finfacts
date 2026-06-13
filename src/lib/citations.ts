/**
 * Citation formatting for FinFacts.
 *
 * Renders bibliographic records in **CSE (Council of Science Editors) name-year**
 * style — the science-discipline standard — with an optional **APA** toggle for
 * education readers. In-text references render as `(Author Year)` and link to a
 * full reference entry with a DOI where available.
 *
 * The {@link CitationData} shape mirrors the `citations` collection schema in
 * `src/content.config.ts`. These helpers are pure and framework-agnostic so they
 * can be used from `.astro`, Preact islands, or build scripts.
 *
 * @see https://en.wikipedia.org/wiki/Council_of_Science_Editors
 * @see https://apastyle.apa.org/
 */

/** A bibliographic record. Mirrors the `citations` collection schema. */
export interface CitationData {
  /** Reference target id (the citation file's slug). Optional for ad-hoc use. */
  id?: string;
  type?: string;
  /** Author names, each ideally formatted "Family GivenInitials" (e.g. "Pacoureau N"). */
  authors?: string[];
  year?: number | null;
  title: string;
  /** Journal, book, or database/site name. */
  container?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  edition?: string;
  editors?: string[];
  doi?: string | null;
  url?: string | null;
  accessedDate?: Date | string;
  license?: string;
}

/** Style selector for {@link formatReference}. */
export type CitationStyle = 'cse' | 'apa';

/**
 * Normalize a DOI into a resolvable `https://doi.org/…` URL.
 * Accepts bare DOIs, `doi:` prefixes, or already-qualified URLs.
 */
export function doiUrl(doi: string | null | undefined): string | undefined {
  if (!doi) return undefined;
  const trimmed = doi.trim().replace(/^doi:\s*/i, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://doi.org/${trimmed}`;
}

/** Extract the family name (first whitespace-delimited token) from an author string. */
function familyName(author: string): string {
  return author.trim().split(/\s+/)[0] ?? author.trim();
}

/** Format a date as ISO `YYYY-MM-DD` for accessed-date rendering. */
function isoDate(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

/**
 * Build a CSE name-year in-text citation, e.g. `(Pacoureau et al. 2021)`.
 *
 * - 1 author: `(Smith 2021)`
 * - 2 authors: `(Smith and Jones 2021)`
 * - 3+ authors: `(Smith et al. 2021)`
 * - no authors: falls back to a short title.
 */
export function inTextCSE(citation: CitationData): string {
  const year = citation.year ?? 'n.d.';
  const authors = citation.authors ?? [];
  let label: string;
  if (authors.length === 0) {
    label = shortTitle(citation.title);
  } else if (authors.length === 1) {
    label = familyName(authors[0]);
  } else if (authors.length === 2) {
    label = `${familyName(authors[0])} and ${familyName(authors[1])}`;
  } else {
    label = `${familyName(authors[0])} et al.`;
  }
  return `(${label} ${year})`;
}

/** First few words of a title, for author-less in-text fallbacks. */
function shortTitle(title: string): string {
  const words = title.split(/\s+/).slice(0, 3).join(' ');
  return `"${words}${title.split(/\s+/).length > 3 ? '…' : ''}"`;
}

/** Join author names for a CSE reference list (comma-separated, no "and"). */
function authorsCSE(authors: string[]): string {
  return authors.join(', ');
}

/** Join author names for an APA reference list (commas, ampersand before the last). */
function authorsAPA(authors: string[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) return authors[0];
  return `${authors.slice(0, -1).join(', ')}, & ${authors[authors.length - 1]}`;
}

/**
 * Format a full CSE name-year reference-list entry.
 *
 * Pattern: `Authors. Year. Title. Container Volume(Issue):Pages. doi:DOI. URL [accessed YYYY-MM-DD].`
 * Missing parts are omitted gracefully so partial records still render cleanly.
 */
export function formatReferenceCSE(citation: CitationData): string {
  const parts: string[] = [];
  const authors = citation.authors ?? [];

  if (authors.length > 0) parts.push(`${authorsCSE(authors)}.`);
  parts.push(`${citation.year ?? 'n.d.'}.`);
  parts.push(endWithPeriod(citation.title));

  if (citation.container) {
    let host = citation.container;
    if (citation.volume) {
      host += ` ${citation.volume}`;
      if (citation.issue) host += `(${citation.issue})`;
      if (citation.pages) host += `:${citation.pages}`;
    } else if (citation.pages) {
      host += `:${citation.pages}`;
    }
    parts.push(endWithPeriod(host));
  } else if (citation.publisher) {
    parts.push(endWithPeriod(citation.publisher));
  }

  const doi = doiUrl(citation.doi);
  if (doi) parts.push(`${doi}.`);
  else if (citation.url) parts.push(`${citation.url}.`);

  const accessed = isoDate(citation.accessedDate);
  if (accessed) parts.push(`[accessed ${accessed}].`);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Format a full APA (7th ed.) reference-list entry.
 *
 * Pattern: `Authors (Year). Title. Container, Volume(Issue), Pages. https://doi.org/DOI`
 */
export function formatReferenceAPA(citation: CitationData): string {
  const parts: string[] = [];
  const authors = citation.authors ?? [];

  if (authors.length > 0) parts.push(authorsAPA(authors));
  parts.push(`(${citation.year ?? 'n.d.'}).`);
  parts.push(endWithPeriod(citation.title));

  if (citation.container) {
    let host = citation.container;
    if (citation.volume) {
      host += `, ${citation.volume}`;
      if (citation.issue) host += `(${citation.issue})`;
    }
    if (citation.pages) host += `, ${citation.pages}`;
    parts.push(endWithPeriod(host));
  } else if (citation.publisher) {
    parts.push(endWithPeriod(citation.publisher));
  }

  const doi = doiUrl(citation.doi);
  if (doi) parts.push(doi);
  else if (citation.url) parts.push(citation.url);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Dispatch to the requested reference style (defaults to CSE). */
export function formatReference(citation: CitationData, style: CitationStyle = 'cse'): string {
  return style === 'apa' ? formatReferenceAPA(citation) : formatReferenceCSE(citation);
}

/** Ensure a fragment ends with a single period. */
function endWithPeriod(text: string): string {
  const trimmed = text.trim();
  return /[.?!]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * Resolve an ordered list of citation ids against a lookup of all citations,
 * preserving order and silently skipping ids with no match.
 */
export function resolveCitations(
  ids: readonly string[],
  all: ReadonlyMap<string, CitationData>,
): CitationData[] {
  const resolved: CitationData[] = [];
  for (const id of ids) {
    const found = all.get(id);
    if (found) resolved.push(found);
  }
  return resolved;
}
