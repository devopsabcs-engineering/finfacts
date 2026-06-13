/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { IUCN_LABELS, type IucnCategory } from './types';

export interface MapDataTableProps {
  /** Baked dataset key used to locate occurrence + range files. */
  speciesKey: string | number;
  scientificName: string;
  commonName?: string;
  occurrenceUrl?: string;
  rangeMetaUrl?: string;
  iucnCategory?: IucnCategory;
}

interface BandRow {
  band: string;
  gbif: number;
  obis: number;
  total: number;
}

const BANDS: { label: string; test: (lat: number) => boolean }[] = [
  { label: 'Arctic (66\u00B0N\u201390\u00B0N)', test: (l) => l >= 66 },
  { label: 'North Temperate (23\u00B0N\u201366\u00B0N)', test: (l) => l >= 23 && l < 66 },
  { label: 'Tropical (23\u00B0S\u201323\u00B0N)', test: (l) => l > -23 && l < 23 },
  { label: 'South Temperate (66\u00B0S\u201323\u00B0S)', test: (l) => l <= -23 && l > -66 },
  { label: 'Antarctic (90\u00B0S\u201366\u00B0S)', test: (l) => l <= -66 },
];

function bandFor(lat: number): string {
  return BANDS.find((b) => b.test(lat))?.label ?? 'Unknown';
}

/**
 * Accessible paired-data alternative to {@link DistributionMap}. Loads the same
 * baked occurrence GeoJSON, bins records into latitude bands by data source, and
 * renders a sortable HTML table plus a plain-text summary and the IUCN range
 * status. No heavy mapping libraries are imported here, so this renders even
 * without WebGL.
 */
export default function MapDataTable({
  speciesKey,
  scientificName,
  commonName,
  occurrenceUrl,
  rangeMetaUrl,
  iucnCategory,
}: MapDataTableProps) {
  const dataUrl = occurrenceUrl ?? `/data/occurrences/${speciesKey}.geojson`;
  const rangeUrl = rangeMetaUrl ?? `/data/ranges/${speciesKey}.meta.json`;

  const [rows, setRows] = useState<BandRow[]>([]);
  const [hasRange, setHasRange] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sortKey, setSortKey] = useState<keyof BandRow>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [geo, range] = await Promise.all([
          fetch(dataUrl).then((r) => {
            if (!r.ok) throw new Error(`occurrences ${r.status}`);
            return r.json();
          }),
          fetch(rangeUrl)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (cancelled) return;

        const counts = new Map<string, { gbif: number; obis: number }>();
        for (const b of BANDS) counts.set(b.label, { gbif: 0, obis: 0 });
        for (const f of geo.features ?? []) {
          const coords = f?.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) continue;
          const lat = Number(coords[1]);
          if (!Number.isFinite(lat)) continue;
          const key = bandFor(lat);
          const bucket = counts.get(key);
          if (!bucket) continue;
          if (f?.properties?.source === 'obis') bucket.obis += 1;
          else bucket.gbif += 1;
        }
        const built: BandRow[] = [...counts.entries()].map(([band, c]) => ({
          band,
          gbif: c.gbif,
          obis: c.obis,
          total: c.gbif + c.obis,
        }));
        setRows(built);
        setHasRange(range ? Boolean(range.hasRangePolygon) : null);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dataUrl, rangeUrl]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp: number;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          gbif: acc.gbif + r.gbif,
          obis: acc.obis + r.obis,
          total: acc.total + r.total,
        }),
        { gbif: 0, obis: 0, total: 0 },
      ),
    [rows],
  );

  const topBand = useMemo(
    () => rows.reduce<BandRow | null>((best, r) => (!best || r.total > best.total ? r : best), null),
    [rows],
  );

  function toggleSort(key: keyof BandRow) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'band' ? 'asc' : 'desc');
    }
  }

  function ariaSort(key: keyof BandRow): 'ascending' | 'descending' | 'none' {
    if (key !== sortKey) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  }

  const label = commonName ? `${commonName} (${scientificName})` : scientificName;

  if (status === 'loading') {
    return (
      <p role="status" aria-live="polite">
        Loading occurrence data table{'\u2026'}
      </p>
    );
  }
  if (status === 'error') {
    return (
      <p role="alert">
        Occurrence data for {label} could not be loaded. Please try again later.
      </p>
    );
  }

  return (
    <div class="map-data-table">
      <p>
        {totals.total.toLocaleString()} georeferenced occurrence records for{' '}
        <em>{scientificName}</em>
        {commonName ? ` (${commonName})` : ''}: {totals.gbif.toLocaleString()} from GBIF and{' '}
        {totals.obis.toLocaleString()} from OBIS.
        {topBand && topBand.total > 0
          ? ` Most records fall in the ${topBand.band.toLowerCase()} latitude band.`
          : ''}
      </p>
      <table>
        <caption>Occurrence records by latitude band and data source</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort('band')}>
              <button type="button" onClick={() => toggleSort('band')}>
                Latitude band
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort('gbif')}>
              <button type="button" onClick={() => toggleSort('gbif')}>
                GBIF
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort('obis')}>
              <button type="button" onClick={() => toggleSort('obis')}>
                OBIS
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort('total')}>
              <button type="button" onClick={() => toggleSort('total')}>
                Total
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.band}>
              <th scope="row">{r.band}</th>
              <td>{r.gbif.toLocaleString()}</td>
              <td>{r.obis.toLocaleString()}</td>
              <td>{r.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">All bands</th>
            <td>{totals.gbif.toLocaleString()}</td>
            <td>{totals.obis.toLocaleString()}</td>
            <td>{totals.total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <p style={{ fontSize: '0.9rem' }}>
        {iucnCategory
          ? `IUCN Red List status: ${IUCN_LABELS[iucnCategory]} (${iucnCategory}). `
          : ''}
        {hasRange === true
          ? 'An IUCN range polygon is available for this species.'
          : hasRange === false
            ? 'No IUCN range polygon is available; the map shows point records only.'
            : ''}
      </p>
    </div>
  );
}
