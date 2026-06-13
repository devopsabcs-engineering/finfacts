/**
 * IUCN Red List v4 client + OBIS fallback for FinFacts.
 *
 * Wraps the IUCN Red List API v4 (https://api.iucnredlist.org/api/v4). A
 * **bearer token** is required (register at
 * https://api.iucnredlist.org/users/sign_up). Terms are **NON-COMMERCIAL**
 * (research/education); commercial use must go through IBAT. The API is
 * rate-limited and refreshes per Red List version — check
 * `/information/red_list_version` and re-bake when it changes.
 *
 * When no token is present, callers should fall back to OBIS
 * `/checklist/redlist` ({@link redlistChecklist}), which surfaces IUCN
 * categories for marine taxa without any token.
 *
 * Assessment metadata is always shaped as a **sourced-value-friendly object**
 * ({@link AssessmentMeta}) — category code plus criteria, trend, year, and a
 * resolvable assessment URL — never a bare category label. This mirrors the
 * `conservation.iucn` shape in `src/content.config.ts`.
 *
 * @see https://api.iucnredlist.org/api-docs
 */

/** IUCN Red List API v4 base URL. */
export const IUCN_BASE = 'https://api.iucnredlist.org/api/v4';

/** OBIS base (used for the no-token category fallback). */
export const OBIS_BASE = 'https://api.obis.org';

/** IUCN Red List category codes (v4 vocabulary). */
export type IucnCategory = 'EX' | 'EW' | 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD' | 'NE';

/** Population-trend vocabulary aligned with the content schema. */
export type PopulationTrend = 'increasing' | 'stable' | 'decreasing' | 'unknown';

/**
 * Sourced-value-friendly assessment object. Maps cleanly onto the
 * `conservation.iucn` schema. `source` records provenance so a citation can be
 * derived (e.g. `iucn` vs `obis-redlist`).
 */
export interface AssessmentMeta {
  category: IucnCategory;
  categoryLabel?: string;
  criteria?: string;
  populationTrend?: PopulationTrend;
  assessmentYear?: number;
  assessmentUrl?: string;
  assessmentId?: number | string;
  /** Provenance of this metadata: the IUCN v4 API or the OBIS redlist fallback. */
  source: 'iucn' | 'obis-redlist';
  /** Red List version string when known (IUCN path only). */
  redListVersion?: string;
}

/**
 * Fetch the current Red List version string (used to decide when to re-bake).
 * @param token IUCN bearer token.
 */
export async function redListVersion(token: string, init?: RequestInit): Promise<string | null> {
  const res = await fetch(`${IUCN_BASE}/information/red_list_version`, bearer(token, init));
  if (!res.ok) return null;
  const json = (await res.json()) as { red_list_version?: string };
  return json.red_list_version ?? null;
}

/**
 * Fetch the latest assessment for a taxon by binomial name and shape it as an
 * {@link AssessmentMeta}. Returns `null` on any failure (caller should fall back
 * to {@link redlistChecklist}).
 *
 * @param taxon.genus Genus name (e.g. "Carcharodon").
 * @param taxon.species Specific epithet (e.g. "carcharias").
 * @param token IUCN bearer token.
 * @param version Optional Red List version string to stamp onto the result.
 */
export async function assessmentByTaxon(
  taxon: { genus: string; species: string },
  token: string,
  version?: string,
  init?: RequestInit,
): Promise<AssessmentMeta | null> {
  const params = new URLSearchParams({ genus_name: taxon.genus, species_name: taxon.species });
  const res = await fetch(`${IUCN_BASE}/taxa/scientific_name?${params}`, bearer(token, init));
  if (!res.ok) return null;
  const json = (await res.json()) as IucnTaxaResponse;

  const assessments = json.assessments ?? [];
  // Prefer the latest assessment flagged `latest`, else the most recent year.
  const latest =
    assessments.find((a) => a.latest) ??
    [...assessments].sort((a, b) => (b.year_published ?? 0) - (a.year_published ?? 0))[0];
  if (!latest) return null;

  const code = (latest.red_list_category_code ?? '').toUpperCase();
  if (!isIucnCategory(code)) return null;

  return {
    category: code,
    categoryLabel: latest.red_list_category_name,
    criteria: latest.criteria ?? undefined,
    populationTrend: normalizeTrend(latest.population_trend),
    assessmentYear: latest.year_published ? Number(latest.year_published) : undefined,
    assessmentUrl: latest.assessment_id
      ? `https://www.iucnredlist.org/species/assessment/${latest.assessment_id}`
      : undefined,
    assessmentId: latest.assessment_id,
    source: 'iucn',
    redListVersion: version,
  };
}

/**
 * No-token fallback: read an IUCN category for a marine taxon from OBIS
 * `/checklist/redlist`. Returns an {@link AssessmentMeta} with `source:
 * 'obis-redlist'` (category only — OBIS does not carry criteria/trend/year).
 *
 * @param opts.taxonid OBIS/WoRMS AphiaID (preferred).
 * @param opts.scientificname Fallback name filter.
 */
export async function redlistChecklist(opts: {
  taxonid?: number;
  scientificname?: string;
  signal?: AbortSignal;
}): Promise<AssessmentMeta | null> {
  const params = new URLSearchParams();
  if (opts.taxonid != null) params.set('taxonid', String(opts.taxonid));
  else if (opts.scientificname) params.set('scientificname', opts.scientificname);
  else return null;

  const res = await fetch(`${OBIS_BASE}/checklist/redlist?${params}`, { signal: opts.signal });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: Array<{ category?: string; redlist_category?: string }> };
  const first = json.results?.[0];
  const raw = (first?.category ?? first?.redlist_category ?? '').toUpperCase();
  if (!isIucnCategory(raw)) return null;

  return { category: raw, source: 'obis-redlist' };
}

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

/** Partial shape of the IUCN v4 `taxa/scientific_name` response we consume. */
interface IucnTaxaResponse {
  assessments?: Array<{
    assessment_id?: number | string;
    year_published?: number | string;
    latest?: boolean;
    criteria?: string | null;
    population_trend?: string | null;
    red_list_category_code?: string;
    red_list_category_name?: string;
  }>;
}

function bearer(token: string, init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  };
}

function isIucnCategory(code: string): code is IucnCategory {
  return ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE'].includes(code);
}

function normalizeTrend(trend: string | null | undefined): PopulationTrend | undefined {
  if (!trend) return undefined;
  const t = trend.toLowerCase();
  if (t.includes('increas')) return 'increasing';
  if (t.includes('decreas')) return 'decreasing';
  if (t.includes('stable')) return 'stable';
  return 'unknown';
}
