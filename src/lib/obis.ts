/**
 * OBIS (Ocean Biodiversity Information System) client helpers for FinFacts.
 *
 * Wraps the OBIS v3 REST API (https://api.obis.org). OBIS is marine-focused and
 * WoRMS-aligned: every record carries an `AphiaID` and many carry a
 * `redlist_category`, which makes it the natural occurrence source for sharks
 * and a no-token bridge to IUCN categories.
 *
 * These helpers are pure and framework-agnostic. The build-time script
 * `scripts/fetch-occurrences.mjs` mirrors this contract in plain ESM (Node cannot
 * import `.ts` at runtime); keep the two in sync when endpoints change.
 *
 * Auth model: **no key required** for any endpoint used here.
 *
 * @see https://api.obis.org/
 */

/** OBIS v3 base URL. */
export const OBIS_BASE = 'https://api.obis.org';

/** A simplified OBIS occurrence record (subset of Darwin Core fields we bake). */
export interface ObisOccurrence {
  id?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
  date_year?: number;
  basisOfRecord?: string;
  dataset_id?: string;
  aphiaID?: number;
}

/**
 * Fetch occurrence points for a taxon via the no-auth `/occurrence` endpoint.
 *
 * Prefer filtering by `taxonid` (AphiaID) for precision; fall back to
 * `scientificname`. OBIS caps `size` at 10,000 per request — this helper pages
 * with the `after` cursor until `cap` records (or the dataset end) is reached.
 *
 * @param opts.taxonid OBIS/WoRMS AphiaID (preferred filter).
 * @param opts.scientificname Fallback name filter.
 * @param opts.cap Maximum points to collect (default 5000).
 * @param opts.signal Optional AbortSignal for per-request timeouts.
 */
export async function occurrencePoints(opts: {
  taxonid?: number;
  scientificname?: string;
  cap?: number;
  signal?: AbortSignal;
}): Promise<ObisOccurrence[]> {
  const cap = opts.cap ?? 5000;
  const out: ObisOccurrence[] = [];
  let after: string | undefined;

  while (out.length < cap) {
    const params = new URLSearchParams({ size: String(Math.min(10000, cap - out.length)) });
    if (opts.taxonid != null) params.set('taxonid', String(opts.taxonid));
    else if (opts.scientificname) params.set('scientificname', opts.scientificname);
    else break;
    if (after) params.set('after', after);

    const res = await fetch(`${OBIS_BASE}/occurrence?${params}`, withUserAgent({ signal: opts.signal }));
    if (!res.ok) break;
    const page = (await res.json()) as { results?: ObisOccurrence[] };
    const results = page.results ?? [];
    for (const r of results) {
      if (typeof r.decimalLatitude === 'number' && typeof r.decimalLongitude === 'number') out.push(r);
    }
    if (results.length === 0) break;
    // OBIS cursor paging: the `id` of the last record seeds the next `after`.
    const last = results[results.length - 1];
    if (!last?.id) break;
    after = last.id;
  }
  return out.slice(0, cap);
}

/**
 * Build an OBIS Mapbox Vector Tile (`.mvt`) URL template or a concrete tile URL.
 *
 * Vector tiles let the runtime map render dense occurrence layers without baking
 * every point. Pass `{x,y,z}` for a concrete tile, or omit them to get a
 * `{z}/{x}/{y}` template string suitable for a MapLibre/deck.gl tile source.
 *
 * @param opts.taxonid AphiaID filter applied to the tile query.
 * @param opts.scientificname Name filter (used when no taxonid).
 * @param opts.x Tile column (omit for a template).
 * @param opts.y Tile row (omit for a template).
 * @param opts.z Zoom (omit for a template).
 * @see https://api.obis.org/ — `/occurrence/tile/{x}/{y}/{z}.mvt`
 */
export function tileUrl(opts: {
  taxonid?: number;
  scientificname?: string;
  x?: number;
  y?: number;
  z?: number;
}): string {
  const params = new URLSearchParams();
  if (opts.taxonid != null) params.set('taxonid', String(opts.taxonid));
  else if (opts.scientificname) params.set('scientificname', opts.scientificname);
  const query = params.toString() ? `?${params}` : '';

  const hasCoords = opts.x != null && opts.y != null && opts.z != null;
  const path = hasCoords ? `${opts.x}/${opts.y}/${opts.z}` : '{x}/{y}/{z}';
  return `${OBIS_BASE}/occurrence/tile/${path}.mvt${query}`;
}

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

/** Descriptive User-Agent sent on every request. */
const OBIS_USER_AGENT = 'FinFacts/0.1 (+https://github.com/devopsabcs-engineering/finfacts; educational)';

function withUserAgent(init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: { 'User-Agent': OBIS_USER_AGENT, ...(init?.headers ?? {}) },
  };
}
