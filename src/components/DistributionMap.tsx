/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface DistributionMapProps {
  /** Baked dataset key (GBIF taxon key or WoRMS AphiaID) used to find data. */
  speciesKey: string | number;
  scientificName: string;
  commonName?: string;
  /** Override the baked occurrences GeoJSON URL. */
  occurrenceUrl?: string;
  /** Override the baked range/assessment metadata URL. */
  metaUrl?: string;
  /** Map height in pixels. */
  height?: number;
}

interface OccurrenceMeta {
  scientificName?: string;
  counts?: { gbif?: number; obis?: number; total?: number };
  sources?: string[];
}

const OCEAN_BASE =
  'https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';
const OCEAN_REFERENCE =
  'https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri \u2014 Sources: GEBCO, NOAA, National Geographic, Garmin, and other contributors. Not for navigation.';

/**
 * MapLibre GL + deck.gl occurrence map for a single species. All heavy
 * libraries (`maplibre-gl`, `@deck.gl/*`) are dynamically imported inside the
 * mount effect so they never enter the base bundle. The map is paired with a
 * `MapDataTable` for screen-reader and no-WebGL fallback (the paired-data-table
 * pattern); this component renders only the visual layer plus status text.
 */
export default function DistributionMap({
  speciesKey,
  scientificName,
  commonName,
  occurrenceUrl,
  metaUrl,
  height = 460,
}: DistributionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [meta, setMeta] = useState<OccurrenceMeta | null>(null);

  const dataUrl = occurrenceUrl ?? `/data/occurrences/${speciesKey}.geojson`;
  const metadataUrl = metaUrl ?? `/data/occurrences/${speciesKey}.meta.json`;

  useEffect(() => {
    let cancelled = false;
    let map: { remove(): void } | null = null;

    async function init() {
      const el = containerRef.current;
      if (!el) return;
      try {
        const [{ Map: MapLibreMap }, deckMapbox, deckLayers] = await Promise.all([
          import('maplibre-gl'),
          import('@deck.gl/mapbox'),
          import('@deck.gl/layers'),
        ]);

        // Fetch metadata + occurrences in parallel; tolerate a missing meta file.
        const [geojson, metaJson] = await Promise.all([
          fetch(dataUrl).then((r) => {
            if (!r.ok) throw new Error(`occurrences ${r.status}`);
            return r.json();
          }),
          fetch(metadataUrl)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (cancelled) return;
        if (metaJson) setMeta(metaJson as OccurrenceMeta);

        const instance = new MapLibreMap({
          container: el,
          style: {
            version: 8,
            sources: {
              'ocean-base': {
                type: 'raster',
                tiles: [OCEAN_BASE],
                tileSize: 256,
                attribution: ESRI_ATTRIBUTION,
              },
              'ocean-reference': {
                type: 'raster',
                tiles: [OCEAN_REFERENCE],
                tileSize: 256,
              },
            },
            layers: [
              { id: 'ocean-base', type: 'raster', source: 'ocean-base' },
              { id: 'ocean-reference', type: 'raster', source: 'ocean-reference' },
            ],
          },
          center: [0, 10],
          zoom: 1,
          // Keyboard pan/zoom is enabled by default once the canvas has focus.
        });
        map = instance;

        instance.on('load', () => {
          if (cancelled) return;
          const overlay = new deckMapbox.MapboxOverlay({
            interleaved: false,
            layers: [
              new deckLayers.ScatterplotLayer({
                id: 'occurrences',
                data: (geojson.features ?? []) as Array<{
                  geometry: { coordinates: [number, number] };
                  properties?: { source?: string };
                }>,
                getPosition: (f) => f.geometry.coordinates,
                getFillColor: (f) =>
                  f.properties?.source === 'obis'
                    ? [0, 119, 187, 160]
                    : [204, 51, 17, 160],
                getRadius: 3,
                radiusUnits: 'pixels',
                radiusMinPixels: 2,
                radiusMaxPixels: 6,
                pickable: true,
              }),
            ],
          });
          instance.addControl(
            overlay as unknown as import('maplibre-gl').IControl,
          );
          if (!cancelled) setStatus('ready');
        });

        instance.on('error', () => {
          if (!cancelled) setStatus('error');
        });
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void init();
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [dataUrl, metadataUrl]);

  const label = commonName ? `${commonName} (${scientificName})` : scientificName;
  const total = meta?.counts?.total;

  return (
    <figure class="distribution-map" style={{ margin: 0 }}>
      <div
        ref={containerRef}
        role="application"
        tabIndex={0}
        aria-label={`Interactive occurrence map for ${label}. Use arrow keys to pan and plus or minus to zoom. A data table with the same information follows.`}
        style={{
          width: '100%',
          height: `${height}px`,
          borderRadius: '8px',
          background: '#dfe9f0',
          outline: 'none',
        }}
      />
      <figcaption style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
        <span role="status" aria-live="polite">
          {status === 'loading' && 'Loading occurrence map\u2026'}
          {status === 'ready' &&
            `Occurrence records for ${label}${
              typeof total === 'number' ? ` (${total.toLocaleString()} points shown)` : ''
            }. Red = GBIF, blue = OBIS.`}
          {status === 'error' &&
            'The interactive map could not be displayed. The data table below contains the same occurrence information.'}
        </span>
      </figcaption>
    </figure>
  );
}
