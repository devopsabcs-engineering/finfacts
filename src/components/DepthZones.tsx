/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

export interface DepthZonesItem {
  id: string;
  scientificName: string;
  commonName?: string;
  depthMinM: number;
  depthMaxM: number;
}

export interface DepthZonesProps {
  species: DepthZonesItem[];
  height?: number;
}

const ZONES: { label: string; from: number; to: number; fill: string }[] = [
  { label: 'Epipelagic (sunlight) 0\u2013200 m', from: 0, to: 200, fill: '#cfeffc' },
  { label: 'Mesopelagic (twilight) 200\u20131000 m', from: 200, to: 1000, fill: '#7fb8d6' },
  { label: 'Bathypelagic (midnight) 1000\u20134000 m', from: 1000, to: 4000, fill: '#3a6b8c' },
];

type ScaleFn = (value: number) => number;

/**
 * Depth-range visualiser placing each shark's occupied water column against
 * named ocean light zones. D3 (dynamically imported) supplies the vertical
 * scale. Zones are labelled in text (not colour only) and a paired data table
 * lists exact minimum/maximum depths.
 */
export default function DepthZones({ species, height = 420 }: DepthZonesProps) {
  const [scale, setScale] = useState<{ fn: ScaleFn } | null>(null);

  const items = useMemo(
    () => [...species].sort((a, b) => a.depthMaxM - b.depthMaxM),
    [species],
  );
  const maxDepth = useMemo(
    () => Math.max(200, ...items.map((i) => i.depthMaxM)),
    [items],
  );

  const top = 16;
  const plotHeight = height - top - 16;

  useEffect(() => {
    let cancelled = false;
    async function build() {
      const d3 = await import('d3');
      if (cancelled) return;
      const s = d3.scaleLinear().domain([0, maxDepth]).range([top, top + plotHeight]);
      setScale({ fn: (v: number) => s(v) });
    }
    void build();
    return () => {
      cancelled = true;
    };
  }, [maxDepth, plotHeight]);

  const width = 640;
  const laneStart = 220;
  const laneWidth = width - laneStart - 60;
  const colW = items.length ? Math.min(48, laneWidth / items.length) : 24;

  return (
    <figure class="depth-zones">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={`Depth ranges for ${items.length} sharks across ocean light zones, from the surface to ${maxDepth} metres. A data table with the same values follows.`}
      >
        {scale
          ? ZONES.filter((z) => z.from < maxDepth).map((z) => {
              const y0 = scale.fn(z.from);
              const y1 = scale.fn(Math.min(z.to, maxDepth));
              return (
                <g key={z.label}>
                  <rect x={0} y={y0} width={width} height={Math.max(0, y1 - y0)} fill={z.fill} />
                  <text x={6} y={y0 + 14} font-size="12" fill="#0b2530">
                    {z.label}
                  </text>
                </g>
              );
            })
          : null}
        {scale
          ? items.map((s, idx) => {
              const x = laneStart + idx * colW;
              const y0 = scale.fn(s.depthMinM);
              const y1 = scale.fn(s.depthMaxM);
              return (
                <g key={s.id}>
                  <rect
                    x={x}
                    y={y0}
                    width={Math.max(6, colW - 8)}
                    height={Math.max(2, y1 - y0)}
                    fill="#11303b"
                    opacity={0.85}
                  >
                    <title>
                      {(s.commonName ?? s.scientificName) +
                        `: ${s.depthMinM}\u2013${s.depthMaxM} m`}
                    </title>
                  </rect>
                </g>
              );
            })
          : null}
      </svg>
      <figcaption>Occupied depth range by species against ocean light zones</figcaption>
      <table>
        <caption class="visually-hidden">Depth range by species</caption>
        <thead>
          <tr>
            <th scope="col">Species</th>
            <th scope="col">Minimum depth (m)</th>
            <th scope="col">Maximum depth (m)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <th scope="row">{s.commonName ?? s.scientificName}</th>
              <td>{s.depthMinM}</td>
              <td>{s.depthMaxM}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
