// Maps `species` content-collection entries into the plain, serialisable prop
// shapes the Preact islands expect. Centralising the projection here keeps the
// page frontmatter small and guarantees every page hands islands the same
// `astro:content`-free objects (so heavy content types never reach the client).

import type { CollectionEntry } from 'astro:content';
import type {
  IucnCategory,
  PopulationTrend,
  SpeciesSummary,
} from '../components/types';
import type { SizeComparisonItem } from '../components/SizeComparison';
import type { DepthZonesItem } from '../components/DepthZones';
import type { DiveSpecies, DiveSite } from '../components/DivePlanner';
import type { ShootSpecies } from '../components/ShootPlanner';

type SpeciesEntry = CollectionEntry<'species'>;

/** Relative URL to a species detail page. */
export function speciesHref(id: string): string {
  return `/species/${id}/`;
}

/** Preferred English common name, falling back to the first listed name. */
export function preferredCommonName(entry: SpeciesEntry): string | undefined {
  const names = entry.data.identity?.commonNames ?? [];
  const preferred = names.find((n) => n.preferred);
  return (preferred ?? names[0])?.name;
}

/** Maximum total length in centimetres, when recorded. */
export function maxLengthCm(entry: SpeciesEntry): number | undefined {
  return entry.data.morphology?.size?.maxTotalLength?.value;
}

/** Lightweight summary used by the explorer, charts, and size/depth visuals. */
export function toSummary(entry: SpeciesEntry): SpeciesSummary {
  const depth = entry.data.distribution?.depthRangeM;
  return {
    id: entry.id,
    scientificName: entry.data.identity.scientificName,
    commonName: preferredCommonName(entry),
    order: entry.data.taxonomy.order,
    family: entry.data.taxonomy.family,
    iucnCategory: entry.data.conservation.iucn.category as IucnCategory,
    populationTrend: entry.data.conservation.iucn.populationTrend as
      | PopulationTrend
      | undefined,
    maxLengthCm: maxLengthCm(entry),
    depthMinM: depth?.min,
    depthMaxM: depth?.max,
    regions: entry.data.distribution?.rangeRegions ?? [],
    diversEncounter: entry.data.diving?.commonlyEncountered ?? false,
    frequentlyFilmed: entry.data.filming?.frequentlyFilmed ?? false,
    href: speciesHref(entry.id),
  };
}

/** Size-comparison item; only species with a recorded max length qualify. */
export function toSizeItem(entry: SpeciesEntry): SizeComparisonItem | null {
  const len = maxLengthCm(entry);
  if (len === undefined) return null;
  return {
    id: entry.id,
    scientificName: entry.data.identity.scientificName,
    commonName: preferredCommonName(entry),
    maxLengthCm: len,
  };
}

/** Depth-zone item; only species with a recorded depth envelope qualify. */
export function toDepthItem(entry: SpeciesEntry): DepthZonesItem | null {
  const depth = entry.data.distribution?.depthRangeM;
  if (depth?.min === undefined || depth?.max === undefined) return null;
  return {
    id: entry.id,
    scientificName: entry.data.identity.scientificName,
    commonName: preferredCommonName(entry),
    depthMinM: depth.min,
    depthMaxM: depth.max,
  };
}

/** Dive-planner record derived from the `diving` overlay (DR-07). */
export function toDiveSpecies(entry: SpeciesEntry): DiveSpecies | null {
  const diving = entry.data.diving;
  if (!diving) return null;
  const sites: DiveSite[] = (diving.exemplarSites ?? []).map((s) => ({
    name: s.name,
    region: s.region,
    season: s.season,
  }));
  return {
    id: entry.id,
    scientificName: entry.data.identity.scientificName,
    commonName: preferredCommonName(entry),
    href: speciesHref(entry.id),
    commonlyEncountered: diving.commonlyEncountered,
    encounterRegions: diving.encounterRegions ?? [],
    typicalDepthMinM: diving.typicalEncounterDepthM?.min,
    typicalDepthMaxM: diving.typicalEncounterDepthM?.max,
    cageDivingCommon: diving.cageDivingCommon,
    certificationLevel: diving.certificationLevel,
    sites,
  };
}

/** Shoot-planner record derived from the `filming` overlay (DR-07). */
export function toShootSpecies(entry: SpeciesEntry): ShootSpecies | null {
  const filming = entry.data.filming;
  if (!filming) return null;
  return {
    id: entry.id,
    scientificName: entry.data.identity.scientificName,
    commonName: preferredCommonName(entry),
    href: speciesHref(entry.id),
    frequentlyFilmed: filming.frequentlyFilmed,
    recommendedGear: filming.recommendedGear ?? [],
    ambientLightDepthM: filming.ambientLightDepthM?.value,
    filmingNotes: filming.filmingNotes,
    ethicsChecklist: filming.ethicsChecklist ?? [],
  };
}

/** Filter helper that drops nulls and narrows the type. */
export function compact<T>(items: (T | null)[]): T[] {
  return items.filter((x): x is T => x !== null);
}
