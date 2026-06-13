/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks';

export interface RiskItem {
  id: string;
  label: string;
  /** Lifetime odds expressed as "1 in N". Larger N = rarer. */
  oneInN: number;
}

export interface RiskExplainerProps {
  /**
   * Risk comparisons. When omitted, a clearly-marked SAMPLE set is used.
   * Figures must be verified against the current ISAF "What Are the Odds?"
   * table before publication.
   */
  items?: RiskItem[];
  /** Set false once authoritative ISAF figures replace the sample. */
  isSample?: boolean;
  basisNote?: string;
}

/**
 * SAMPLE lifetime-odds figures. NOT authoritative.
 *
 * EDITORIAL TODO (DR-07): replace with the current Florida Museum / ISAF
 * "What Are the Odds?" lifetime-risk table and cite it. The numbers below are
 * order-of-magnitude placeholders for layout only.
 */
const SAMPLE_ITEMS: RiskItem[] = [
  { id: 'heart', label: 'Heart disease', oneInN: 5 },
  { id: 'car', label: 'Motor-vehicle crash', oneInN: 100 },
  { id: 'drowning', label: 'Drowning', oneInN: 1000 },
  { id: 'lightning', label: 'Lightning strike', oneInN: 80000 },
  { id: 'shark', label: 'Shark bite', oneInN: 4000000 },
];

function formatOdds(n: number): string {
  return `1 in ${n.toLocaleString('en-US')}`;
}

/**
 * Risk-in-context explainer. Frames shark-bite risk against everyday hazards
 * using a refutation structure (state the fear, then the evidence) and an
 * accessible odds table. The bars use a log scale because the magnitudes span
 * several orders; the table carries the exact figures for assistive tech.
 */
export default function RiskExplainer({
  items,
  isSample,
  basisNote,
}: RiskExplainerProps) {
  const usingSample = items === undefined || isSample === true;
  const data = items ?? SAMPLE_ITEMS;
  const [sortByRisk, setSortByRisk] = useState(true);

  const rows = useMemo(() => {
    const copy = [...data];
    // Higher risk = smaller N. Sort most-likely first when sortByRisk.
    copy.sort((a, b) => (sortByRisk ? a.oneInN - b.oneInN : b.oneInN - a.oneInN));
    return copy;
  }, [data, sortByRisk]);

  // Log-scaled bar widths (inverse: rarer events get shorter bars).
  const maxLog = useMemo(
    () => Math.max(...data.map((d) => Math.log10(d.oneInN))),
    [data],
  );

  return (
    <section class="risk-explainer" aria-label="Shark-bite risk in context">
      {usingSample ? (
        <p class="risk-explainer__sample" role="note">
          <strong>{'SAMPLE figures \u2014 not authoritative.'}</strong> Replace with
          the current ISAF &ldquo;What Are the Odds?&rdquo; table before
          publication (editorial TODO, DR-07).
        </p>
      ) : null}

      <div class="risk-explainer__framing">
        <p>
          <strong>The fear:</strong> sharks are a leading danger to people in the
          ocean.
        </p>
        <p>
          <strong>The evidence:</strong> a shark bite is among the rarest causes
          of injury a person will ever face. Everyday activities most people do
          without a second thought carry far higher lifetime odds, as the
          comparison below shows.
        </p>
      </div>

      <button
        type="button"
        class="risk-explainer__toggle"
        onClick={() => setSortByRisk((v) => !v)}
        aria-pressed={sortByRisk}
      >
        Sort {sortByRisk ? 'rarest first' : 'most likely first'}
      </button>

      <ul class="risk-explainer__bars" aria-hidden="true">
        {rows.map((d) => {
          const widthPct = Math.max(4, 100 - (Math.log10(d.oneInN) / maxLog) * 96);
          const isShark = d.id === 'shark';
          return (
            <li key={d.id} class="risk-explainer__bar-row">
              <span class="risk-explainer__bar-label">{d.label}</span>
              <span
                class="risk-explainer__bar"
                style={{
                  width: `${widthPct}%`,
                  background: isShark ? '#0a7d8c' : '#888888',
                }}
              />
              <span class="risk-explainer__bar-value">{formatOdds(d.oneInN)}</span>
            </li>
          );
        })}
      </ul>

      <table class="risk-explainer__table">
        <caption>Lifetime odds compared{basisNote ? ` (${basisNote})` : ''}</caption>
        <thead>
          <tr>
            <th scope="col">Cause</th>
            <th scope="col">Lifetime odds</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <th scope="row">{d.label}</th>
              <td>{formatOdds(d.oneInN)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
