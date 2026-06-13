/**
 * GBIF (Global Biodiversity Information Facility) client helpers for FinFacts.
 *
 * Wraps the stable GBIF v1 REST API (https://api.gbif.org/v1). These helpers are
 * pure and framework-agnostic so they can be used from `.astro`, Preact islands,
 * or build scripts. The build-time ingestion script
 * `scripts/fetch-occurrences.mjs` mirrors this contract in plain ESM (Node cannot
 * import `.ts` at runtime), so keep the two in sync when changing endpoints.
 *
 * Auth model:
 * - **Reads** (`species/match`, `occurrence/search`) require **no auth**.
 * - **Async downloads** (`occurrence/download/*`) require **HTTP Basic Auth**
 *   with a free GBIF account. Reads are preferred for the launch pipeline; the
 *   download → DOI flow is provided for future full baking and citation.
 *
 * GBIF reads may return HTTP 429 under load; always send a descriptive
 * `User-Agent` and back off. Cite occurrence pulls via the download DOI per
 * https://www.gbif.org/citation-guidelines.
 *
 * @see https://techdocs.gbif.org/en/openapi/
 */

/** GBIF v1 base URL. */
export const GBIF_BASE = 'https://api.gbif.org/v1';

/** Descriptive User-Agent sent on every request (GBIF asks for one). */
export const GBIF_USER_AGENT = 'FinFacts/0.1 (+https://github.com/devopsabcs-engineering/finfacts; educational)';

/** Result of a GBIF backbone name match. */
export interface GbifMatch {
  usageKey?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  status?: string;
  matchType?: string;
  confidence?: number;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

/** A simplified occurrence record (subset of Darwin Core fields we bake). */
export interface GbifOccurrence {
  key?: number;
  decimalLatitude?: number;
  decimalLongitude?: number;
  year?: number;
  basisOfRecord?: string;
  datasetKey?: string;
  countryCode?: string;
}

/** Status payload returned while polling an async download. */
export interface GbifDownloadStatus {
  key: string;
  status: 'PREPARING' | 'RUNNING' | 'SUCCEEDED' | 'CANCELLED' | 'KILLED' | 'FAILED' | 'SUSPENDED' | string;
  doi?: string;
  downloadLink?: string;
  totalRecords?: number;
}

/**
 * Match a scientific name to the GBIF backbone taxonomy and resolve its
 * `usageKey` (taxonKey). No auth required.
 *
 * @param name Scientific name (e.g. "Carcharodon carcharias").
 * @param init Optional fetch init (pass an AbortSignal for timeouts).
 */
export async function matchSpecies(name: string, init?: RequestInit): Promise<GbifMatch | null> {
  const url = `${GBIF_BASE}/species/match?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, withUserAgent(init));
  if (!res.ok) return null;
  return (await res.json()) as GbifMatch;
}

/**
 * Search occurrences via the no-auth `occurrence/search` endpoint, paging until
 * `cap` records (or the dataset end) is reached. Returns only georeferenced
 * records that carry decimal lat/long.
 *
 * @param opts.taxonKey GBIF backbone `usageKey` (preferred filter).
 * @param opts.scientificName Fallback name filter when no taxonKey is known.
 * @param opts.cap Maximum number of points to collect (default 5000).
 * @param opts.pageSize Records per page (GBIF max 300; default 300).
 * @param opts.signal Optional AbortSignal for per-request timeouts.
 */
export async function searchOccurrences(opts: {
  taxonKey?: number;
  scientificName?: string;
  cap?: number;
  pageSize?: number;
  signal?: AbortSignal;
}): Promise<GbifOccurrence[]> {
  const cap = opts.cap ?? 5000;
  const pageSize = Math.min(opts.pageSize ?? 300, 300);
  const out: GbifOccurrence[] = [];
  let offset = 0;

  while (out.length < cap) {
    const params = new URLSearchParams({
      hasCoordinate: 'true',
      hasGeospatialIssue: 'false',
      limit: String(Math.min(pageSize, cap - out.length)),
      offset: String(offset),
    });
    if (opts.taxonKey != null) params.set('taxonKey', String(opts.taxonKey));
    else if (opts.scientificName) params.set('scientificName', opts.scientificName);
    else break;

    const res = await fetch(`${GBIF_BASE}/occurrence/search?${params}`, withUserAgent({ signal: opts.signal }));
    if (!res.ok) break;
    const page = (await res.json()) as { results?: GbifOccurrence[]; endOfRecords?: boolean };
    const results = page.results ?? [];
    for (const r of results) {
      if (typeof r.decimalLatitude === 'number' && typeof r.decimalLongitude === 'number') out.push(r);
    }
    if (page.endOfRecords || results.length === 0) break;
    offset += results.length;
  }
  return out.slice(0, cap);
}

/**
 * Request an asynchronous GBIF occurrence download (full, citable export).
 *
 * Requires HTTP Basic Auth with a free GBIF account. Returns the download key
 * used to poll {@link pollDownload}. The completed download yields a DOI that
 * should be captured as a citation. Intended for future full baking — the launch
 * pipeline uses {@link searchOccurrences} for a capped sample.
 *
 * @param predicate A GBIF download predicate (≤100,000 params), e.g.
 *   `{ type: 'equals', key: 'TAXON_KEY', value: '2475263' }`.
 * @param auth GBIF account credentials.
 * @returns The download key (job id), or `null` on failure.
 * @see https://techdocs.gbif.org/en/data-use/api-downloads
 */
export async function requestDownload(
  predicate: unknown,
  auth: { username: string; password: string },
  init?: RequestInit,
): Promise<string | null> {
  const body = JSON.stringify({
    creator: auth.username,
    notificationAddresses: [],
    sendNotification: false,
    format: 'SIMPLE_CSV',
    predicate,
  });
  const res = await fetch(`${GBIF_BASE}/occurrence/download/request`, {
    ...withUserAgent(init),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuth(auth.username, auth.password),
      'User-Agent': GBIF_USER_AGENT,
    },
    body,
  });
  if (!res.ok) return null;
  // The endpoint returns the download key as plain text.
  return (await res.text()).trim();
}

/**
 * Poll an async download by key for status and (when SUCCEEDED) its DOI.
 * Reads need no auth.
 *
 * @param downloadKey Key returned by {@link requestDownload}.
 */
export async function pollDownload(downloadKey: string, init?: RequestInit): Promise<GbifDownloadStatus | null> {
  const res = await fetch(`${GBIF_BASE}/occurrence/download/${encodeURIComponent(downloadKey)}`, withUserAgent(init));
  if (!res.ok) return null;
  return (await res.json()) as GbifDownloadStatus;
}

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

function withUserAgent(init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: { 'User-Agent': GBIF_USER_AGENT, ...(init?.headers ?? {}) },
  };
}

function basicAuth(user: string, pass: string): string {
  // btoa is available in Node 18+ and browsers; encode credentials for Basic Auth.
  return `Basic ${btoa(`${user}:${pass}`)}`;
}
