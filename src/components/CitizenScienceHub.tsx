/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

export type CitizenCategory = 'eggcase' | 'sightings' | 'identification' | 'tagging';

export interface CitizenProgram {
  id: string;
  name: string;
  org?: string;
  url: string;
  category: CitizenCategory;
  region?: string;
  description?: string;
}

export interface CitizenScienceHubProps {
  /**
   * Citizen-science programmes. When omitted, a clearly-marked SAMPLE set is
   * used; links and scope must be verified before publication.
   */
  programs?: CitizenProgram[];
  isSample?: boolean;
}

const ANY = '__any__';
const FAV_KEY = 'finfacts-citsci-favourites';

const CATEGORY_LABELS: Record<CitizenCategory, string> = {
  eggcase: 'Eggcase recording',
  sightings: 'Dive & beach sightings',
  identification: 'Photo identification',
  tagging: 'Tagging & tracking',
};

/**
 * SAMPLE programme list. Verify every link, scope, and organisation before
 * publication (editorial TODO, DR-07).
 */
const SAMPLE_PROGRAMS: CitizenProgram[] = [
  {
    id: 'eggcase-hunt',
    name: 'Great Eggcase Hunt',
    org: 'The Shark Trust',
    url: 'https://www.sharktrust.org/great-eggcase-hunt',
    category: 'eggcase',
    region: 'Global',
    description: 'Record shark, skate, and ray eggcases found on the shore.',
  },
  {
    id: 'inaturalist',
    name: 'iNaturalist',
    url: 'https://www.inaturalist.org/',
    category: 'identification',
    region: 'Global',
    description: 'Upload photos of sharks to contribute verifiable occurrence records.',
  },
  {
    id: 'reef',
    name: 'REEF Volunteer Fish Survey',
    org: 'REEF',
    url: 'https://www.reef.org/',
    category: 'sightings',
    region: 'Americas',
    description: 'Log shark and ray sightings during recreational dives.',
  },
  {
    id: 'spot-a-shark',
    name: 'Spot A Shark',
    url: 'https://www.spotashark.com/',
    category: 'identification',
    region: 'Global',
    description: 'Match spot patterns to help identify individual sharks over time.',
  },
];

function loadFavs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavs(favs: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  } catch {
    /* best-effort */
  }
}

/**
 * Citizen-science hub: a filterable directory of programmes where readers can
 * contribute shark observations. Favourites are stored locally only. Rendered
 * as a semantic list of cards with text labels (not colour) for every state.
 */
export default function CitizenScienceHub({
  programs,
  isSample,
}: CitizenScienceHubProps) {
  const usingSample = programs === undefined || isSample === true;
  const data = programs ?? SAMPLE_PROGRAMS;
  const [category, setCategory] = useState<string>(ANY);
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    setFavs(loadFavs());
  }, []);

  const categories = useMemo(() => {
    const set = new Set<CitizenCategory>();
    data.forEach((p) => set.add(p.category));
    return [...set];
  }, [data]);

  const visible = useMemo(
    () => data.filter((p) => category === ANY || p.category === category),
    [data, category],
  );

  function toggleFav(id: string) {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    saveFavs(next);
  }

  return (
    <section class="citizen-science" aria-label="Citizen science hub">
      {usingSample ? (
        <p class="citizen-science__sample" role="note">
          <strong>{'SAMPLE directory \u2014 verify links.'}</strong> Confirm each
          programme, URL, and region before publication (editorial TODO, DR-07).
        </p>
      ) : null}

      <label class="citizen-science__filter">
        Filter by activity
        <select value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}>
          <option value={ANY}>All activities</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <p role="status" aria-live="polite">
        {visible.length} programme{visible.length === 1 ? '' : 's'}
      </p>

      <ul class="citizen-science__list">
        {visible.map((p) => {
          const favourite = favs.includes(p.id);
          return (
            <li key={p.id} class="citizen-science__card">
              <h3>
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  {p.name}
                </a>
              </h3>
              <p class="citizen-science__meta">
                {CATEGORY_LABELS[p.category]}
                {p.region ? ` \u00B7 ${p.region}` : ''}
                {p.org ? ` \u00B7 ${p.org}` : ''}
              </p>
              {p.description ? <p>{p.description}</p> : null}
              <button
                type="button"
                aria-pressed={favourite}
                onClick={() => toggleFav(p.id)}
              >
                {favourite ? '\u2605 Saved' : '\u2606 Save'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
