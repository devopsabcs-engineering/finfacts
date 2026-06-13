/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

export interface ShootSpecies {
  id: string;
  scientificName: string;
  commonName?: string;
  href: string;
  frequentlyFilmed?: boolean;
  recommendedGear: string[];
  ambientLightDepthM?: number;
  filmingNotes?: string;
  ethicsChecklist: string[];
}

export interface ShootPlannerProps {
  /** Derived from each species' `filming` overlay (DR-07) in Phase 5. */
  species: ShootSpecies[];
}

const ANY = '__any__';
const CHECK_KEY = 'finfacts-shoot-ethics';

function loadChecks(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CHECK_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveChecks(checks: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
  } catch {
    /* best-effort */
  }
}

/**
 * Underwater-film shoot planner: pick a target species to assemble recommended
 * gear, an ambient-light depth guide, and an interactive ethics/permit
 * checklist (state persisted to localStorage only). Everything renders as
 * semantic lists so it is fully usable by assistive technology.
 */
export default function ShootPlanner({ species }: ShootPlannerProps) {
  const [targetId, setTargetId] = useState(ANY);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecks(loadChecks());
  }, []);

  const target = useMemo(
    () => species.find((s) => s.id === targetId) ?? null,
    [species, targetId],
  );

  function toggle(item: string) {
    const next = { ...checks, [item]: !checks[item] };
    setChecks(next);
    saveChecks(next);
  }

  return (
    <section class="shoot-planner" aria-label="Underwater film shoot planner">
      <label class="shoot-planner__target">
        Target species
        <select value={targetId} onChange={(e) => setTargetId((e.target as HTMLSelectElement).value)}>
          <option value={ANY}>{'Choose a species\u2026'}</option>
          {species.map((s) => (
            <option key={s.id} value={s.id}>
              {s.commonName ?? s.scientificName}
            </option>
          ))}
        </select>
      </label>

      {target === null ? (
        <p role="status">Select a target species to build a shoot plan.</p>
      ) : (
        <div class="shoot-planner__plan">
          <h3>
            <a href={target.href}>{target.commonName ?? target.scientificName}</a>
          </h3>
          {target.frequentlyFilmed ? (
            <p>This species is frequently filmed and well documented.</p>
          ) : (
            <p>Footage of this species is comparatively rare; plan extra contingency time.</p>
          )}

          <h4>Recommended gear</h4>
          {target.recommendedGear.length > 0 ? (
            <ul>
              {target.recommendedGear.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          ) : (
            <p>No gear notes recorded yet.</p>
          )}

          <h4>Ambient light</h4>
          <p>
            {target.ambientLightDepthM !== undefined
              ? `Usable ambient light typically reaches about ${target.ambientLightDepthM} m; plan artificial lighting below this depth.`
              : 'Ambient-light depth not recorded; test lighting on site.'}
          </p>

          {target.filmingNotes ? (
            <>
              <h4>Field notes</h4>
              <p>{target.filmingNotes}</p>
            </>
          ) : null}

          <h4>Ethics &amp; permits checklist</h4>
          {target.ethicsChecklist.length > 0 ? (
            <ul class="shoot-planner__checklist">
              {target.ethicsChecklist.map((item) => {
                const id = `${target.id}-${item}`;
                return (
                  <li key={id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!checks[item]}
                        onChange={() => toggle(item)}
                      />{' '}
                      {item}
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>
              No species-specific ethics notes yet. Always confirm local permits, keep a
              respectful distance, and avoid altering animal behaviour.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
