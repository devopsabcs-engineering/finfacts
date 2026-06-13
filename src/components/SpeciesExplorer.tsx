/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  IUCN_LABELS,
  IUCN_STYLE,
  type IucnCategory,
  type SpeciesSummary,
} from './types';

export interface SpeciesExplorerProps {
  species: SpeciesSummary[];
}

type FuseLike = {
  search(query: string): Array<{ item: SpeciesSummary }>;
};

const ANY = '__any__';

/**
 * Client-side species browser with fuzzy text search (Fuse.js, dynamically
 * imported) plus faceted filters for order, family, IUCN status, ocean region,
 * encounter, and filming flags. Results are a plain, screen-reader friendly list
 * so the component degrades gracefully before hydration.
 */
export default function SpeciesExplorer({ species }: SpeciesExplorerProps) {
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState(ANY);
  const [family, setFamily] = useState(ANY);
  const [iucn, setIucn] = useState<IucnCategory | typeof ANY>(ANY);
  const [region, setRegion] = useState(ANY);
  const [diversOnly, setDiversOnly] = useState(false);
  const [filmedOnly, setFilmedOnly] = useState(false);
  const [fuse, setFuse] = useState<FuseLike | null>(null);

  // Build the Fuse index once per species list, off the base bundle.
  useEffect(() => {
    let cancelled = false;
    async function build() {
      const mod = await import('fuse.js');
      if (cancelled) return;
      const Fuse = mod.default;
      setFuse(
        new Fuse(species, {
          keys: ['commonName', 'scientificName', 'family', 'order', 'regions'],
          threshold: 0.35,
          ignoreLocation: true,
        }) as unknown as FuseLike,
      );
    }
    void build();
    return () => {
      cancelled = true;
    };
  }, [species]);

  const orders = useMemo(
    () => [...new Set(species.map((s) => s.order))].sort(),
    [species],
  );
  const families = useMemo(
    () => [...new Set(species.map((s) => s.family))].sort(),
    [species],
  );
  const iucnCodes = useMemo(
    () => [...new Set(species.map((s) => s.iucnCategory))],
    [species],
  );
  const regions = useMemo(
    () => [...new Set(species.flatMap((s) => s.regions))].sort(),
    [species],
  );

  const results = useMemo(() => {
    const base =
      query.trim() && fuse ? fuse.search(query).map((r) => r.item) : species;
    return base.filter(
      (s) =>
        (order === ANY || s.order === order) &&
        (family === ANY || s.family === family) &&
        (iucn === ANY || s.iucnCategory === iucn) &&
        (region === ANY || s.regions.includes(region)) &&
        (!diversOnly || s.diversEncounter) &&
        (!filmedOnly || s.frequentlyFilmed),
    );
  }, [species, fuse, query, order, family, iucn, region, diversOnly, filmedOnly]);

  return (
    <section class="species-explorer" aria-label="Species explorer">
      <div class="species-explorer__controls">
        <label>
          Search
          <input
            type="search"
            value={query}
            placeholder={'Name, family, region\u2026'}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          Order
          <select value={order} onChange={(e) => setOrder((e.target as HTMLSelectElement).value)}>
            <option value={ANY}>All orders</option>
            {orders.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          Family
          <select value={family} onChange={(e) => setFamily((e.target as HTMLSelectElement).value)}>
            <option value={ANY}>All families</option>
            {families.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label>
          IUCN status
          <select
            value={iucn}
            onChange={(e) => setIucn((e.target as HTMLSelectElement).value as IucnCategory)}
          >
            <option value={ANY}>All statuses</option>
            {iucnCodes.map((c) => (
              <option key={c} value={c}>
                {IUCN_LABELS[c]} ({c})
              </option>
            ))}
          </select>
        </label>
        <label>
          Region
          <select value={region} onChange={(e) => setRegion((e.target as HTMLSelectElement).value)}>
            <option value={ANY}>All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label class="species-explorer__check">
          <input
            type="checkbox"
            checked={diversOnly}
            onChange={(e) => setDiversOnly((e.target as HTMLInputElement).checked)}
          />
          Divers encounter
        </label>
        <label class="species-explorer__check">
          <input
            type="checkbox"
            checked={filmedOnly}
            onChange={(e) => setFilmedOnly((e.target as HTMLInputElement).checked)}
          />
          Frequently filmed
        </label>
      </div>

      <p role="status" aria-live="polite">
        {results.length} of {species.length} species shown.
      </p>

      <ul class="species-explorer__results">
        {results.map((s) => {
          const style = IUCN_STYLE[s.iucnCategory];
          return (
            <li key={s.id}>
              <a href={s.href}>
                <strong>{s.commonName ?? s.scientificName}</strong>
                {s.commonName ? <em> {s.scientificName}</em> : null}
              </a>
              <span class="species-explorer__status">
                <span aria-hidden="true" style={{ color: style.color }}>
                  {style.symbol}
                </span>{' '}
                {IUCN_LABELS[s.iucnCategory]} ({s.iucnCategory})
              </span>
              <span class="species-explorer__meta">
                {s.order} {'\u00B7'} {s.family}
                {typeof s.maxLengthCm === 'number'
                  ? ` \u00B7 up to ${(s.maxLengthCm / 100).toFixed(1)} m`
                  : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
