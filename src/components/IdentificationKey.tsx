/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks';

export interface KeyLead {
  text: string;
  /** Next couplet id, or a terminal result when `result` is set. */
  next?: string;
  result?: string;
}

export interface Couplet {
  id: string;
  leads: [KeyLead, KeyLead];
}

export interface IdentificationKeyProps {
  /**
   * Dichotomous couplets. When omitted, a clearly-marked SAMPLE dataset is
   * used so the component is demonstrable before authoritative data is added.
   */
  couplets?: Couplet[];
  rootId?: string;
  /** Set false only once authoritative couplets have replaced the sample. */
  isSample?: boolean;
}

/**
 * SAMPLE dichotomous key. NOT taxonomically authoritative.
 *
 * EDITORIAL TODO (DR-04 / DR-05): replace these placeholder couplets with
 * verified leads sourced from the FAO Species Catalogue for Fishery Purposes
 * (sharks of the world) and/or an established interactive key such as
 * elasmo-key.org. Do not present the sample as a final identification key.
 */
const SAMPLE_COUPLETS: Couplet[] = [
  {
    id: '1',
    leads: [
      { text: 'Body strongly flattened, ray-like; mouth at front of head', next: '2' },
      { text: 'Body cylindrical or torpedo-shaped; mouth underneath head', next: '3' },
    ],
  },
  {
    id: '2',
    leads: [
      { text: 'Pectoral fins very broad, overlapping the gill region', result: 'Angel shark (Squatina) \u2014 SAMPLE' },
      { text: 'Snout extended into a long, saw-like blade', result: 'Sawshark (Pristiophorus) \u2014 SAMPLE' },
    ],
  },
  {
    id: '3',
    leads: [
      { text: 'A single dorsal fin set far back; six or seven gill slits', result: 'Cow/frilled shark (Hexanchiformes) \u2014 SAMPLE' },
      { text: 'Two dorsal fins; five gill slits', next: '4' },
    ],
  },
  {
    id: '4',
    leads: [
      { text: 'Mouth filled with tiny teeth; enormous filter-feeder', result: 'Whale shark (Rhincodon typus) \u2014 SAMPLE' },
      { text: 'Stout teeth; active predator with a crescent tail', result: 'Mackerel shark (Lamnidae) \u2014 SAMPLE' },
    ],
  },
];

/**
 * Step-through dichotomous identification key. Each couplet offers two leads;
 * choosing one advances to the next couplet or a terminal result. A plain-text
 * outline of every couplet is rendered as the accessible alternative so the key
 * is fully usable without interaction.
 */
export default function IdentificationKey({
  couplets,
  rootId = '1',
  isSample,
}: IdentificationKeyProps) {
  const usingSample = couplets === undefined || isSample === true;
  const data = couplets ?? SAMPLE_COUPLETS;
  const byId = useMemo(() => {
    const m = new Map<string, Couplet>();
    for (const c of data) m.set(c.id, c);
    return m;
  }, [data]);

  const [currentId, setCurrentId] = useState(rootId);
  const [path, setPath] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const current = byId.get(currentId) ?? null;

  function pick(lead: KeyLead) {
    setPath((p) => [...p, lead.text]);
    if (lead.result) {
      setResult(lead.result);
    } else if (lead.next) {
      setCurrentId(lead.next);
    }
  }

  function restart() {
    setCurrentId(rootId);
    setPath([]);
    setResult(null);
  }

  return (
    <section class="identification-key" aria-label="Dichotomous identification key">
      {usingSample ? (
        <p class="identification-key__sample" role="note">
          <strong>{'SAMPLE key \u2014 not authoritative.'}</strong> These couplets are
          placeholders for demonstration. Editorial TODO: replace with verified
          leads from the FAO Species Catalogue or elasmo-key.org before
          publication.
        </p>
      ) : null}

      <div class="identification-key__interactive">
        {result ? (
          <div role="status" aria-live="polite">
            <p>
              <strong>Result:</strong> {result}
            </p>
            <button type="button" onClick={restart}>
              Start over
            </button>
          </div>
        ) : current ? (
          <fieldset>
            <legend>Couplet {current.id}</legend>
            <ol class="identification-key__leads">
              {current.leads.map((lead, idx) => (
                <li key={`${current.id}-${idx}`}>
                  <button type="button" onClick={() => pick(lead)}>
                    {lead.text}
                  </button>
                </li>
              ))}
            </ol>
            {path.length > 0 ? (
              <button type="button" class="identification-key__restart" onClick={restart}>
                Start over
              </button>
            ) : null}
          </fieldset>
        ) : (
          <p role="alert">This key has no starting couplet.</p>
        )}

        {path.length > 0 ? (
          <nav aria-label="Choices so far">
            <ol class="identification-key__path">
              {path.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </nav>
        ) : null}
      </div>

      <details class="identification-key__outline">
        <summary>View the full key as text</summary>
        <ol>
          {data.map((c) => (
            <li key={c.id}>
              Couplet {c.id}
              <ul>
                {c.leads.map((lead, idx) => (
                  <li key={idx}>
                    {lead.text}
                    {' \u2192 '}
                    {lead.result ? lead.result : `go to couplet ${lead.next}`}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
