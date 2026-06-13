#!/usr/bin/env node
/**
 * scripts/fetch-occurrences.mjs — FinFacts build-time data ingestion pipeline.
 *
 * Runs as the `prebuild` step (see package.json). For each species in
 * `src/content/species/*`, it:
 *   1. Reads the file's frontmatter and extracts `externalIds` + scientific name.
 *   2. Fetches GBIF + OBIS occurrence points (no auth), simplifies to GeoJSON,
 *      and writes `public/data/occurrences/<aphiaId>.geojson` plus a
 *      `<aphiaId>.meta.json` sidecar (counts, sources, optional GBIF download DOI).
 *   3. Fetches IUCN Red List v4 assessment metadata + range polygons when
 *      `IUCN_API_TOKEN` is set (Bearer, non-commercial); otherwise falls back to
 *      OBIS `/checklist/redlist` for the IUCN category. Simplified range polygons
 *      go to `public/data/ranges/<aphiaId>.geojson`; assessment metadata (shaped
 *      as a sourced-value-friendly object) goes to `public/data/ranges/<aphiaId>.meta.json`.
 *
 * DESIGN NOTES
 * - This script is a plain-ESM mirror of the typed helpers in `src/lib/{gbif,obis,iucn}.ts`.
 *   Node cannot import `.ts` at runtime, so the fetch logic is duplicated here on
 *   purpose. Keep the two in sync when endpoints change.
 * - **Offline / failure tolerant by design.** Every network call is wrapped so a
 *   failure, timeout, or rate-limit logs a warning and skips — `npm run build`
 *   must NEVER fail because an API was unreachable. With zero species present the
 *   script no-ops cleanly. Any unexpected top-level error still exits 0.
 * - Frontmatter parsing is intentionally dependency-free: a minimal targeted
 *   extractor pulls the handful of fields we need (external IDs + scientific
 *   name/genus/species) without a YAML library. Swap for a full YAML parser if
 *   content frontmatter grows more complex.
 * - Polygon simplification uses a minimal inline Douglas-Peucker implementation
 *   (no new dependency).
 *
 * ENVIRONMENT VARIABLES (all optional)
 * - SKIP_DATA_FETCH — when set to any non-empty value, the script logs and exits
 *                     immediately without any network calls, reusing whatever is
 *                     already committed under public/data. Used by fast CI quality
 *                     jobs (axe-core / Lighthouse) that don't need fresh data.
 *                     Unset by default so production/deploy builds bake live data.
 * - IUCN_API_TOKEN  — IUCN Red List v4 bearer token (non-commercial). When set,
 *                     enables assessment + range polygon fetch. Without it, the
 *                     script falls back to OBIS for the IUCN category only.
 * - GBIF_USER / GBIF_PASS — GBIF account for the async download → DOI flow
 *                     (NOT used by the launch capped-sample path; reserved for
 *                     future full baking via requestGbifDownload/pollGbifDownload).
 *
 * Idempotent: re-running overwrites outputs deterministically. Node 20+ (global
 * fetch, AbortController). No build dependency on any live API at runtime.
 */

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPECIES_DIR = join(ROOT, 'src', 'content', 'species');
const OCC_DIR = join(ROOT, 'public', 'data', 'occurrences');
const RANGE_DIR = join(ROOT, 'public', 'data', 'ranges');

const USER_AGENT = 'FinFacts/0.1 (+https://github.com/devopsabcs-engineering/finfacts; educational)';
const REQUEST_TIMEOUT_MS = 15_000;
const GBIF_POINT_CAP = 5_000;
const OBIS_POINT_CAP = 5_000;
const GBIF_PAGE_SIZE = 300; // GBIF occurrence/search hard max
const SIMPLIFY_TOLERANCE_DEG = 0.05; // ~5 km; tune for visual fidelity vs. size

const GBIF_BASE = 'https://api.gbif.org/v1';
const OBIS_BASE = 'https://api.obis.org';
const IUCN_BASE = 'https://api.iucnredlist.org/api/v4';

const IUCN_TOKEN = process.env.IUCN_API_TOKEN?.trim() || '';

const FRONTMATTER_EXTS = new Set(['.md', '.mdx', '.markdown']);
const DATA_EXTS = new Set(['.json', '.yaml', '.yml']);

/* -------------------------------------------------------------------------- */
/* Network helper — never throws                                              */
/* -------------------------------------------------------------------------- */

/**
 * Fetch JSON with a timeout. Returns `null` (never throws) on any failure:
 * non-2xx, abort/timeout, network error, or JSON parse error.
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<any|null>}
 */
async function safeFetchJson(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      console.warn(`[fetch-occurrences] WARN ${res.status} ${res.statusText} for ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[fetch-occurrences] WARN request failed for ${url}: ${err?.message ?? err}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Frontmatter extraction (dependency-free, targeted)                         */
/* -------------------------------------------------------------------------- */

/**
 * Extract the species fields we need from a content file. Targets specific keys
 * by name (regardless of nesting depth) rather than fully parsing YAML, to stay
 * dependency-free and resilient.
 *
 * @param {string} text Raw file contents.
 * @returns {{ aphiaId: number|null, gbifTaxonKey: number|null,
 *   iucnTaxonId: number|null, scientificName: string|null,
 *   genus: string|null, species: string|null } | null}
 */
function extractSpeciesMeta(text) {
  // For markdown, restrict to the frontmatter block to reduce false positives.
  let scope = text;
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fm) scope = fm[1];

  const num = (key) => {
    const m = scope.match(new RegExp(`${key}\\s*:\\s*(\\d+)`));
    return m ? Number(m[1]) : null;
  };
  const str = (key) => {
    const m = scope.match(new RegExp(`${key}\\s*:\\s*["']?([^"'\\r\\n]+?)["']?\\s*$`, 'm'));
    return m ? m[1].trim() : null;
  };

  const aphiaId = num('wormsAphiaId');
  const scientificName = str('scientificName');
  const genus = str('genus');
  const species = str('species');

  // A species must at least have an AphiaID (primary join key) or a name to query.
  if (aphiaId == null && !scientificName && !(genus && species)) return null;

  return {
    aphiaId,
    gbifTaxonKey: num('gbifTaxonKey'),
    iucnTaxonId: num('iucnTaxonId'),
    scientificName,
    genus,
    species,
  };
}

/** A stable output key for a species: AphiaID when present, else a name slug. */
function outputKey(meta) {
  if (meta.aphiaId != null) return String(meta.aphiaId);
  const name = meta.scientificName ?? `${meta.genus ?? ''}-${meta.species ?? ''}`;
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

/** Discover species by reading frontmatter from every file in SPECIES_DIR. */
async function discoverSpecies() {
  /** @type {Array<ReturnType<typeof extractSpeciesMeta>>} */
  const found = [];
  let entries;
  try {
    entries = await readdir(SPECIES_DIR, { withFileTypes: true });
  } catch {
    return found; // directory may not exist yet
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name).toLowerCase();
    if (entry.name.startsWith('.')) continue; // skip .gitkeep and dotfiles
    if (!FRONTMATTER_EXTS.has(ext) && !DATA_EXTS.has(ext)) continue;
    try {
      const text = await readFile(join(SPECIES_DIR, entry.name), 'utf8');
      const meta = extractSpeciesMeta(text);
      if (meta) found.push(meta);
      else console.warn(`[fetch-occurrences] WARN ${entry.name}: no AphiaID/name found; skipping`);
    } catch (err) {
      console.warn(`[fetch-occurrences] WARN could not read ${entry.name}: ${err?.message ?? err}`);
    }
  }
  return found;
}

/* -------------------------------------------------------------------------- */
/* GBIF (plain-ESM mirror of src/lib/gbif.ts)                                 */
/* -------------------------------------------------------------------------- */

/** Resolve a GBIF backbone taxonKey from a scientific name (no auth). */
async function gbifMatch(name) {
  const json = await safeFetchJson(`${GBIF_BASE}/species/match?name=${encodeURIComponent(name)}`);
  return json?.usageKey ?? null;
}

/** Page GBIF occurrence/search for georeferenced points up to GBIF_POINT_CAP. */
async function gbifSearchOccurrences({ taxonKey, scientificName }) {
  const out = [];
  let offset = 0;
  while (out.length < GBIF_POINT_CAP) {
    const params = new URLSearchParams({
      hasCoordinate: 'true',
      hasGeospatialIssue: 'false',
      limit: String(Math.min(GBIF_PAGE_SIZE, GBIF_POINT_CAP - out.length)),
      offset: String(offset),
    });
    if (taxonKey != null) params.set('taxonKey', String(taxonKey));
    else if (scientificName) params.set('scientificName', scientificName);
    else break;

    const page = await safeFetchJson(`${GBIF_BASE}/occurrence/search?${params}`);
    const results = page?.results ?? [];
    if (results.length === 0) break;
    for (const r of results) {
      if (typeof r.decimalLatitude === 'number' && typeof r.decimalLongitude === 'number') {
        out.push({
          lon: r.decimalLongitude,
          lat: r.decimalLatitude,
          year: r.year ?? null,
          basisOfRecord: r.basisOfRecord ?? null,
          datasetKey: r.datasetKey ?? null,
          source: 'gbif',
        });
      }
    }
    if (page?.endOfRecords) break;
    offset += results.length;
  }
  return out;
}

/**
 * Request an async GBIF download (full, citable export → DOI). Reserved for
 * future full baking; the launch pipeline uses the capped search above. Requires
 * GBIF_USER / GBIF_PASS. Documented here so the DOI flow is ready to wire in.
 *
 * @param {unknown} predicate GBIF download predicate.
 * @returns {Promise<string|null>} download key, or null.
 */
async function requestGbifDownload(predicate) {
  const user = process.env.GBIF_USER?.trim();
  const pass = process.env.GBIF_PASS?.trim();
  if (!user || !pass) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${GBIF_BASE}/occurrence/download/request`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
      },
      body: JSON.stringify({ creator: user, sendNotification: false, format: 'SIMPLE_CSV', predicate }),
    });
    if (!res.ok) return null;
    return (await res.text()).trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Poll an async GBIF download for status + DOI (no auth). Reserved for future use. */
async function pollGbifDownload(downloadKey) {
  return safeFetchJson(`${GBIF_BASE}/occurrence/download/${encodeURIComponent(downloadKey)}`);
}

/* -------------------------------------------------------------------------- */
/* OBIS (plain-ESM mirror of src/lib/obis.ts)                                 */
/* -------------------------------------------------------------------------- */

/** Page OBIS /occurrence for georeferenced points up to OBIS_POINT_CAP. */
async function obisOccurrencePoints({ taxonid, scientificname }) {
  const out = [];
  let after;
  while (out.length < OBIS_POINT_CAP) {
    const params = new URLSearchParams({ size: String(Math.min(10000, OBIS_POINT_CAP - out.length)) });
    if (taxonid != null) params.set('taxonid', String(taxonid));
    else if (scientificname) params.set('scientificname', scientificname);
    else break;
    if (after) params.set('after', after);

    const page = await safeFetchJson(`${OBIS_BASE}/occurrence?${params}`);
    const results = page?.results ?? [];
    if (results.length === 0) break;
    for (const r of results) {
      if (typeof r.decimalLatitude === 'number' && typeof r.decimalLongitude === 'number') {
        out.push({
          lon: r.decimalLongitude,
          lat: r.decimalLatitude,
          year: r.date_year ?? null,
          basisOfRecord: r.basisOfRecord ?? null,
          datasetKey: r.dataset_id ?? null,
          source: 'obis',
        });
      }
    }
    const last = results[results.length - 1];
    if (!last?.id) break;
    after = last.id;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* IUCN (plain-ESM mirror of src/lib/iucn.ts) + OBIS redlist fallback         */
/* -------------------------------------------------------------------------- */

const IUCN_CATEGORIES = new Set(['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE']);

/** GET the current Red List version string (IUCN bearer). */
async function iucnRedListVersion() {
  if (!IUCN_TOKEN) return null;
  const json = await safeFetchJson(`${IUCN_BASE}/information/red_list_version`, {
    headers: { Authorization: `Bearer ${IUCN_TOKEN}` },
  });
  return json?.red_list_version ?? null;
}

/** Fetch + shape the latest IUCN assessment as a sourced-value-friendly object. */
async function iucnAssessment({ genus, species }, version) {
  if (!IUCN_TOKEN || !genus || !species) return null;
  const params = new URLSearchParams({ genus_name: genus, species_name: species });
  const json = await safeFetchJson(`${IUCN_BASE}/taxa/scientific_name?${params}`, {
    headers: { Authorization: `Bearer ${IUCN_TOKEN}` },
  });
  const assessments = json?.assessments ?? [];
  const latest =
    assessments.find((a) => a.latest) ??
    [...assessments].sort((a, b) => (Number(b.year_published) || 0) - (Number(a.year_published) || 0))[0];
  if (!latest) return null;
  const code = String(latest.red_list_category_code ?? '').toUpperCase();
  if (!IUCN_CATEGORIES.has(code)) return null;

  const trend = String(latest.population_trend ?? '').toLowerCase();
  return {
    category: code,
    categoryLabel: latest.red_list_category_name ?? undefined,
    criteria: latest.criteria ?? undefined,
    populationTrend: trend.includes('increas')
      ? 'increasing'
      : trend.includes('decreas')
        ? 'decreasing'
        : trend.includes('stable')
          ? 'stable'
          : trend
            ? 'unknown'
            : undefined,
    assessmentYear: latest.year_published ? Number(latest.year_published) : undefined,
    assessmentUrl: latest.assessment_id
      ? `https://www.iucnredlist.org/species/assessment/${latest.assessment_id}`
      : undefined,
    assessmentId: latest.assessment_id ?? undefined,
    source: 'iucn',
    redListVersion: version ?? undefined,
  };
}

/** No-token fallback: read an IUCN category from OBIS /checklist/redlist. */
async function obisRedlistFallback({ taxonid, scientificname }) {
  const params = new URLSearchParams();
  if (taxonid != null) params.set('taxonid', String(taxonid));
  else if (scientificname) params.set('scientificname', scientificname);
  else return null;
  const json = await safeFetchJson(`${OBIS_BASE}/checklist/redlist?${params}`);
  const first = json?.results?.[0];
  const code = String(first?.category ?? first?.redlist_category ?? '').toUpperCase();
  if (!IUCN_CATEGORIES.has(code)) return null;
  return { category: code, source: 'obis-redlist' };
}

/**
 * Best-effort IUCN range polygon fetch. The IUCN v4 REST API does not serve
 * range geometry directly (spatial data ships via authenticated downloads), so
 * this returns null at launch and is left as a documented extension point for
 * when a geometry source is wired in. Returning null is handled gracefully.
 *
 * @returns {Promise<object|null>} A GeoJSON geometry (Polygon/MultiPolygon) or null.
 */
async function iucnRangeGeometry(/* { iucnTaxonId } */) {
  // Intentionally not implemented for the launch pipeline. When IUCN spatial
  // download access is available, fetch the geometry here and return it; the
  // caller will simplify and write it to public/data/ranges/<key>.geojson.
  return null;
}

/* -------------------------------------------------------------------------- */
/* Geometry simplification — inline Douglas-Peucker (no dependency)           */
/* -------------------------------------------------------------------------- */

/** Perpendicular distance from point p to the segment a→b (planar lon/lat). */
function perpDistance(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Douglas-Peucker simplify of a single ring/line of [lon,lat] points. */
function simplifyRing(points, tolerance) {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > tolerance) {
    const left = simplifyRing(points.slice(0, index + 1), tolerance);
    const right = simplifyRing(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

/** Simplify a GeoJSON Polygon/MultiPolygon geometry in place; returns a new geometry. */
function simplifyGeometry(geometry, tolerance = SIMPLIFY_TOLERANCE_DEG) {
  if (!geometry || typeof geometry !== 'object') return geometry;
  const closeRing = (ring) => {
    const simplified = simplifyRing(ring, tolerance);
    // Keep polygon rings closed.
    const first = simplified[0];
    const last = simplified[simplified.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) simplified.push(first);
    return simplified.length >= 4 ? simplified : ring; // fall back if over-simplified
  };
  if (geometry.type === 'Polygon') {
    return { type: 'Polygon', coordinates: geometry.coordinates.map(closeRing) };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map((poly) => poly.map(closeRing)),
    };
  }
  return geometry;
}

/* -------------------------------------------------------------------------- */
/* GeoJSON assembly                                                           */
/* -------------------------------------------------------------------------- */

/** Build a GeoJSON FeatureCollection of Point features from occurrence rows. */
function pointsToFeatureCollection(points) {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      properties: {
        source: p.source,
        year: p.year ?? null,
        basisOfRecord: p.basisOfRecord ?? null,
        datasetKey: p.datasetKey ?? null,
      },
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Per-species processing                                                     */
/* -------------------------------------------------------------------------- */

async function processSpecies(meta) {
  const key = outputKey(meta);
  const label = meta.scientificName ?? (`${meta.genus ?? ''} ${meta.species ?? ''}`.trim() || key);
  console.log(`[fetch-occurrences] processing ${label} (key=${key})`);

  /* --- Occurrences: GBIF + OBIS ------------------------------------------ */
  let gbifTaxonKey = meta.gbifTaxonKey;
  if (gbifTaxonKey == null && meta.scientificName) {
    gbifTaxonKey = await gbifMatch(meta.scientificName);
  }
  const gbifPoints = await gbifSearchOccurrences({
    taxonKey: gbifTaxonKey,
    scientificName: meta.scientificName,
  });
  const obisPoints = await obisOccurrencePoints({
    taxonid: meta.aphiaId,
    scientificname: meta.scientificName,
  });
  const allPoints = [...gbifPoints, ...obisPoints];

  await writeJson(join(OCC_DIR, `${key}.geojson`), pointsToFeatureCollection(allPoints));
  await writeJson(join(OCC_DIR, `${key}.meta.json`), {
    aphiaId: meta.aphiaId ?? null,
    scientificName: meta.scientificName ?? null,
    gbifTaxonKey: gbifTaxonKey ?? null,
    counts: { gbif: gbifPoints.length, obis: obisPoints.length, total: allPoints.length },
    sources: ['gbif', 'obis'],
    // Captured for citation when the async download flow is used; null for the
    // capped-sample launch path.
    gbifDownloadDoi: null,
    retrievedAt: new Date().toISOString(),
  });
  console.log(`[fetch-occurrences]   occurrences: ${gbifPoints.length} GBIF + ${obisPoints.length} OBIS`);

  /* --- Ranges + assessment: IUCN (token) or OBIS fallback ---------------- */
  const version = await iucnRedListVersion();
  let assessment =
    (await iucnAssessment({ genus: meta.genus, species: meta.species }, version)) ??
    (await obisRedlistFallback({ taxonid: meta.aphiaId, scientificname: meta.scientificName }));

  // Range polygons only when IUCN provides geometry (best-effort; null at launch).
  const rawGeometry = await iucnRangeGeometry({ iucnTaxonId: meta.iucnTaxonId });
  if (rawGeometry) {
    const simplified = simplifyGeometry(rawGeometry);
    await writeJson(join(RANGE_DIR, `${key}.geojson`), {
      type: 'Feature',
      geometry: simplified,
      properties: { source: 'iucn', category: assessment?.category ?? null },
    });
    console.log(`[fetch-occurrences]   range polygon written (simplified)`);
  } else {
    console.log(`[fetch-occurrences]   no range geometry available; assessment metadata only`);
  }

  await writeJson(join(RANGE_DIR, `${key}.meta.json`), {
    aphiaId: meta.aphiaId ?? null,
    scientificName: meta.scientificName ?? null,
    assessment: assessment ?? null,
    hasRangePolygon: Boolean(rawGeometry),
    retrievedAt: new Date().toISOString(),
  });
  if (assessment) {
    console.log(`[fetch-occurrences]   assessment: ${assessment.category} (source=${assessment.source})`);
  } else {
    console.log(`[fetch-occurrences]   assessment: none found`);
  }
}

/* -------------------------------------------------------------------------- */
/* IO helpers                                                                 */
/* -------------------------------------------------------------------------- */

async function writeJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  // Fast-path short-circuit for CI quality jobs (axe-core / Lighthouse) and any
  // build that should reuse already-baked `public/data` instead of hitting the
  // network. Defaults to performing the fetch — production/deploy builds leave
  // SKIP_DATA_FETCH unset so live occurrence + range data is baked fresh. Set
  // SKIP_DATA_FETCH=1 (any non-empty value) to skip all network work; the build
  // then serves whatever is already committed under public/data.
  if (process.env.SKIP_DATA_FETCH) {
    console.log('[fetch-occurrences] SKIP_DATA_FETCH set — skipping network fetch; reusing existing public/data (if any).');
    return;
  }

  // Always ensure output directories exist (mkdir -p).
  await mkdir(OCC_DIR, { recursive: true });
  await mkdir(RANGE_DIR, { recursive: true });

  const species = await discoverSpecies();
  if (species.length === 0) {
    console.log('[fetch-occurrences] no species content found; nothing to fetch (no-op).');
    return;
  }

  console.log(`[fetch-occurrences] discovered ${species.length} species; ${IUCN_TOKEN ? 'IUCN token present' : 'no IUCN token — using OBIS redlist fallback'}.`);
  for (const meta of species) {
    try {
      await processSpecies(meta);
    } catch (err) {
      // Never let one species break the run or the build.
      console.warn(`[fetch-occurrences] WARN failed processing ${outputKey(meta)}: ${err?.message ?? err}`);
    }
  }
  console.log('[fetch-occurrences] done.');
}

// Top-level guard: log and exit 0 so `npm run build` never fails on data fetch.
main().catch((err) => {
  console.warn(`[fetch-occurrences] WARN unexpected error (continuing build): ${err?.message ?? err}`);
  process.exitCode = 0;
});
