/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

export interface SizeComparisonItem {
  id: string;
  scientificName: string;
  commonName?: string;
  maxLengthCm: number;
}

export interface SizeComparisonProps {
  species: SizeComparisonItem[];
  /** Reference human height for scale; defaults to 1.8 m. */
  diverHeightCm?: number;
  width?: number;
}

type ScaleFn = (value: number) => number;

/**
 * Shark-versus-diver size comparison. D3 (dynamically imported) provides the
 * linear scale; the bars themselves are plain SVG rendered by Preact so they
 * carry text labels and a paired data table for non-visual users.
 */
export default function SizeComparison({
  species,
  diverHeightCm = 180,
  width = 640,
}: SizeComparisonProps) {
  const [scale, setScale] = useState<{ fn: ScaleFn } | null>(null);

  const items = useMemo(
    () => [...species].sort((a, b) => b.maxLengthCm - a.maxLengthCm),
    [species],
  );
  const maxCm = useMemo(
    () => Math.max(diverHeightCm, ...items.map((i) => i.maxLengthCm), 1),
    [items, diverHeightCm],
  );

  const barArea = width - 220;

  useEffect(() => {
    let cancelled = false;
    async function build() {
      const d3 = await import('d3');
      if (cancelled) return;
      const s = d3.scaleLinear().domain([0, maxCm]).range([0, barArea]);
      setScale({ fn: (v: number) => s(v) });
    }
    void build();
    return () => {
      cancelled = true;
    };
  }, [maxCm, barArea]);

  const rowHeight = 34;
  const diverW = scale ? scale.fn(diverHeightCm) : 0;
  const chartHeight = (items.length + 1) * rowHeight + 16;

  return (
    <figure class="size-comparison">
      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        width="100%"
        role="img"
        aria-label={`Maximum length comparison for ${items.length} sharks against a ${(
          diverHeightCm / 100
        ).toFixed(1)} metre diver. A data table with the same values follows.`}
      >
        <g transform={`translate(0 8)`}>
          <g transform={`translate(0 0)`}>
            <text x={0} y={rowHeight / 2} dominant-baseline="middle" font-size="13">
              Diver (reference)
            </text>
            <rect
              x={200}
              y={6}
              width={diverW}
              height={rowHeight - 12}
              fill="#555555"
            />
            <text
              x={200 + diverW + 6}
              y={rowHeight / 2}
              dominant-baseline="middle"
              font-size="12"
            >
              {(diverHeightCm / 100).toFixed(1)} m
            </text>
          </g>
          {items.map((s, idx) => {
            const w = scale ? scale.fn(s.maxLengthCm) : 0;
            const y = (idx + 1) * rowHeight;
            return (
              <g key={s.id} transform={`translate(0 ${y})`}>
                <text x={0} y={rowHeight / 2} dominant-baseline="middle" font-size="13">
                  {s.commonName ?? s.scientificName}
                </text>
                <rect x={200} y={6} width={w} height={rowHeight - 12} fill="#0a7d8c" />
                <text
                  x={200 + w + 6}
                  y={rowHeight / 2}
                  dominant-baseline="middle"
                  font-size="12"
                >
                  {(s.maxLengthCm / 100).toFixed(1)} m
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption>Maximum recorded length compared with a reference diver</figcaption>
      <table>
        <caption class="visually-hidden">Maximum length by species</caption>
        <thead>
          <tr>
            <th scope="col">Species</th>
            <th scope="col">Maximum length (m)</th>
            <th scope="col">Times diver height</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <th scope="row">{s.commonName ?? s.scientificName}</th>
              <td>{(s.maxLengthCm / 100).toFixed(1)}</td>
              <td>{(s.maxLengthCm / diverHeightCm).toFixed(1)}&times;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
