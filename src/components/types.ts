// Shared prop/data types for FinFacts Preact island components.
// Pages (Phase 5) build these plain objects from content-collection entries and
// pass them as island props, so heavy `astro:content` types never reach the
// client bundle.

/** IUCN Red List category codes used across the conservation visuals. */
export type IucnCategory =
  | 'EX'
  | 'EW'
  | 'CR'
  | 'EN'
  | 'VU'
  | 'NT'
  | 'LC'
  | 'DD'
  | 'NE';

/** IUCN population-trend values. */
export type PopulationTrend = 'increasing' | 'stable' | 'decreasing' | 'unknown';

/**
 * Lightweight species summary used by the explorer, charts, and planners.
 * A serialisable subset of the `species` collection schema.
 */
export interface SpeciesSummary {
  /** Stable slug / collection id (e.g. `carcharodon-carcharias`). */
  id: string;
  scientificName: string;
  /** Preferred English common name when available. */
  commonName?: string;
  order: string;
  family: string;
  iucnCategory: IucnCategory;
  populationTrend?: PopulationTrend;
  /** Maximum total length in centimetres. */
  maxLengthCm?: number;
  /** Depth envelope in metres (positive = metres below surface). */
  depthMinM?: number;
  depthMaxM?: number;
  /** Broad ocean-basin / region tags for faceting. */
  regions: string[];
  /** True when the `diving` overlay marks the species commonly encountered. */
  diversEncounter?: boolean;
  /** True when the `filming` overlay marks the species frequently filmed. */
  frequentlyFilmed?: boolean;
  /** Relative URL to the species page. */
  href: string;
}

/** Human-readable label for each IUCN category. */
export const IUCN_LABELS: Record<IucnCategory, string> = {
  EX: 'Extinct',
  EW: 'Extinct in the Wild',
  CR: 'Critically Endangered',
  EN: 'Endangered',
  VU: 'Vulnerable',
  NT: 'Near Threatened',
  LC: 'Least Concern',
  DD: 'Data Deficient',
  NE: 'Not Evaluated',
};

/**
 * Colour + text-symbol pairing for IUCN categories. Every chart that uses these
 * colours MUST also render the `symbol` and label so meaning is never carried by
 * colour alone (WCAG 1.4.1).
 */
export const IUCN_STYLE: Record<IucnCategory, { color: string; symbol: string }> = {
  EX: { color: '#000000', symbol: '\u2020' }, // dagger
  EW: { color: '#3d2645', symbol: '\u2021' }, // double dagger
  CR: { color: '#d81e05', symbol: '\u25B2' }, // up triangle
  EN: { color: '#fc7f3f', symbol: '\u25C6' }, // diamond
  VU: { color: '#f9e814', symbol: '\u25A0' }, // square
  NT: { color: '#cce226', symbol: '\u25CF' }, // circle
  LC: { color: '#60c659', symbol: '\u2713' }, // check
  DD: { color: '#d1d1c6', symbol: '\u003F' }, // question mark
  NE: { color: '#ffffff', symbol: '\u2013' }, // en dash
};

/** Order of increasing extinction risk (left to right) for axis sorting. */
export const IUCN_RISK_ORDER: IucnCategory[] = [
  'LC',
  'NT',
  'VU',
  'EN',
  'CR',
  'EW',
  'EX',
  'DD',
  'NE',
];
