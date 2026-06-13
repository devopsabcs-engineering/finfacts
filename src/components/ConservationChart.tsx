/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  IUCN_LABELS,
  IUCN_RISK_ORDER,
  IUCN_STYLE,
  type IucnCategory,
  type SpeciesSummary,
} from './types';

export interface ConservationChartProps {
  species: SpeciesSummary[];
  height?: number;
}

interface Tally {
  category: IucnCategory;
  label: string;
  count: number;
  color: string;
  symbol: string;
}

/**
 * Conservation-status bar chart built with Observable Plot (dynamically
 * imported). Status is encoded with colour AND a text symbol AND a written
 * label, so meaning is never conveyed by colour alone (WCAG 1.4.1). A paired
 * data table is always rendered as the accessible alternative.
 */
export default function ConservationChart({
  species,
  height = 320,
}: ConservationChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'error'>('idle');

  const tallies = useMemo<Tally[]>(() => {
    const counts = new Map<IucnCategory, number>();
    for (const s of species) {
      counts.set(s.iucnCategory, (counts.get(s.iucnCategory) ?? 0) + 1);
    }
    return IUCN_RISK_ORDER.filter((c) => (counts.get(c) ?? 0) > 0).map((c) => ({
      category: c,
      label: IUCN_LABELS[c],
      count: counts.get(c) ?? 0,
      color: IUCN_STYLE[c].color,
      symbol: IUCN_STYLE[c].symbol,
    }));
  }, [species]);

  useEffect(() => {
    let cancelled = false;
    const el = container.current;
    if (!el || tallies.length === 0) return;
    async function draw() {
      try {
        const Plot = await import('@observablehq/plot');
        if (cancelled || !el) return;
        const chart = Plot.plot({
          height,
          marginLeft: 48,
          marginBottom: 64,
          x: {
            label: 'IUCN status',
            domain: tallies.map((t) => `${t.symbol} ${t.category}`),
          },
          y: { label: 'Species', grid: true },
          marks: [
            Plot.barY(tallies, {
              x: (t: Tally) => `${t.symbol} ${t.category}`,
              y: 'count',
              fill: (t: Tally) => t.color,
              title: (t: Tally) => `${t.label}: ${t.count}`,
            }),
            Plot.ruleY([0]),
          ],
        });
        el.replaceChildren(chart as Node);
        if (!cancelled) setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    void draw();
    return () => {
      cancelled = true;
      el?.replaceChildren();
    };
  }, [tallies, height]);

  const total = tallies.reduce((acc, t) => acc + t.count, 0);

  return (
    <figure class="conservation-chart">
      <div
        ref={container}
        role="img"
        aria-label={`Bar chart of ${total} species by IUCN Red List status. A data table with the same values follows.`}
      />
      {status === 'error' ? (
        <p role="alert">The chart could not be drawn; see the data table below.</p>
      ) : null}
      <figcaption>Species counts by IUCN Red List status</figcaption>
      <table>
        <caption class="visually-hidden">
          Species counts by IUCN Red List status
        </caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Code</th>
            <th scope="col">Species</th>
          </tr>
        </thead>
        <tbody>
          {tallies.map((t) => (
            <tr key={t.category}>
              <th scope="row">
                <span aria-hidden="true" style={{ color: t.color }}>
                  {t.symbol}
                </span>{' '}
                {t.label}
              </th>
              <td>{t.category}</td>
              <td>{t.count}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={2}>
              Total
            </th>
            <td>{total}</td>
          </tr>
        </tfoot>
      </table>
    </figure>
  );
}
