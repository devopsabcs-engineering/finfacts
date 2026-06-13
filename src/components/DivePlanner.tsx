/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

export interface DiveSite {
  name: string;
  region?: string;
  season?: string;
}

export interface DiveSpecies {
  id: string;
  scientificName: string;
  commonName?: string;
  href: string;
  commonlyEncountered?: boolean;
  encounterRegions: string[];
  typicalDepthMinM?: number;
  typicalDepthMaxM?: number;
  cageDivingCommon?: boolean;
  certificationLevel?: string;
  sites: DiveSite[];
}

export interface DivePlannerProps {
  /** Derived from each species' `diving` overlay (DR-07) in Phase 5. */
  species: DiveSpecies[];
}

interface LoggedDive {
  id: string;
  speciesId: string;
  site: string;
  date: string;
}

const ANY = '__any__';
const LOG_KEY = 'finfacts-dive-log';

function loadLog(): LoggedDive[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    const parsed = raw ? (JSON.parse(raw) as LoggedDive[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLog(log: LoggedDive[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    /* best-effort */
  }
}

/**
 * Dive planner: filter shark-diving opportunities by region, season, and
 * certification, then log intended dives locally (localStorage only, no
 * server). Results are a plain list/table so the planner is fully usable
 * without colour or pointer interaction.
 */
export default function DivePlanner({ species }: DivePlannerProps) {
  const [region, setRegion] = useState(ANY);
  const [season, setSeason] = useState(ANY);
  const [cert, setCert] = useState(ANY);
  const [log, setLog] = useState<LoggedDive[]>([]);

  useEffect(() => {
    setLog(loadLog());
  }, []);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const s of species) {
      s.encounterRegions.forEach((r) => set.add(r));
      s.sites.forEach((site) => site.region && set.add(site.region));
    }
    return [...set].sort();
  }, [species]);

  const seasons = useMemo(() => {
    const set = new Set<string>();
    for (const s of species) s.sites.forEach((site) => site.season && set.add(site.season));
    return [...set].sort();
  }, [species]);

  const certs = useMemo(() => {
    const set = new Set<string>();
    for (const s of species) s.certificationLevel && set.add(s.certificationLevel);
    return [...set].sort();
  }, [species]);

  const matches = useMemo(() => {
    return species
      .map((s) => {
        const sites = s.sites.filter((site) => {
          const regionOk =
            region === ANY ||
            site.region === region ||
            s.encounterRegions.includes(region);
          const seasonOk = season === ANY || site.season === season;
          return regionOk && seasonOk;
        });
        return { species: s, sites };
      })
      .filter(({ species: s, sites }) => {
        const certOk = cert === ANY || s.certificationLevel === cert;
        const regionOk =
          region === ANY || s.encounterRegions.includes(region) || sites.length > 0;
        const seasonOk = season === ANY || sites.length > 0;
        return certOk && regionOk && seasonOk;
      });
  }, [species, region, season, cert]);

  function logDive(s: DiveSpecies, site: string) {
    const entry: LoggedDive = {
      id: `${s.id}-${site}-${Date.now()}`,
      speciesId: s.id,
      site,
      date: new Date().toISOString().slice(0, 10),
    };
    const next = [entry, ...log];
    setLog(next);
    saveLog(next);
  }

  function removeDive(id: string) {
    const next = log.filter((d) => d.id !== id);
    setLog(next);
    saveLog(next);
  }

  return (
    <section class="dive-planner" aria-label="Shark dive planner">
      <form class="dive-planner__filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Region
          <select value={region} onChange={(e) => setRegion((e.target as HTMLSelectElement).value)}>
            <option value={ANY}>Any region</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Season
          <select value={season} onChange={(e) => setSeason((e.target as HTMLSelectElement).value)}>
            <option value={ANY}>Any season</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Certification
          <select value={cert} onChange={(e) => setCert((e.target as HTMLSelectElement).value)}>
            <option value={ANY}>Any level</option>
            {certs.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </form>

      <p role="status" aria-live="polite">
        {matches.length} species match your filters
      </p>

      <ul class="dive-planner__results">
        {matches.map(({ species: s, sites }) => (
          <li key={s.id}>
            <h3>
              <a href={s.href}>{s.commonName ?? s.scientificName}</a>
            </h3>
            <p>
              {s.certificationLevel ? `Suggested certification: ${s.certificationLevel}. ` : ''}
              {s.typicalDepthMinM !== undefined && s.typicalDepthMaxM !== undefined
                ? `Typical encounter depth ${s.typicalDepthMinM}\u2013${s.typicalDepthMaxM} m. `
                : ''}
              {s.cageDivingCommon ? 'Cage diving is common. ' : ''}
            </p>
            {sites.length > 0 ? (
              <ul>
                {sites.map((site) => (
                  <li key={site.name}>
                    {site.name}
                    {site.region ? ` (${site.region})` : ''}
                    {site.season ? ` \u2014 ${site.season}` : ''}{' '}
                    <button type="button" onClick={() => logDive(s, site.name)}>
                      Add to dive log
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No exemplar sites recorded for the current filters.</p>
            )}
          </li>
        ))}
      </ul>

      <section class="dive-planner__log" aria-label="Your dive log">
        <h3>Your dive log</h3>
        {log.length === 0 ? (
          <p>No dives logged yet. Saved locally in your browser only.</p>
        ) : (
          <table>
            <caption class="visually-hidden">Logged dives</caption>
            <thead>
              <tr>
                <th scope="col">Species</th>
                <th scope="col">Site</th>
                <th scope="col">Date</th>
                <th scope="col">Remove</th>
              </tr>
            </thead>
            <tbody>
              {log.map((d) => {
                const s = species.find((x) => x.id === d.speciesId);
                return (
                  <tr key={d.id}>
                    <th scope="row">{s?.commonName ?? s?.scientificName ?? d.speciesId}</th>
                    <td>{d.site}</td>
                    <td>{d.date}</td>
                    <td>
                      <button type="button" onClick={() => removeDive(d.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
