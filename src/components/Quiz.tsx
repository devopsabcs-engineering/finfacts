/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
}

export interface QuizProps {
  questions: QuizQuestion[];
  /** localStorage key for spaced-repetition progress. */
  storageKey?: string;
}

interface Progress {
  /** Leitner box per question id (1 = due often, 5 = mastered). */
  boxes: Record<string, number>;
}

const DEFAULT_KEY = 'finfacts-quiz-progress';

function loadProgress(key: string): Progress {
  if (typeof window === 'undefined') return { boxes: {} };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { boxes: {} };
    const parsed = JSON.parse(raw) as Progress;
    return parsed && typeof parsed === 'object' && parsed.boxes
      ? parsed
      : { boxes: {} };
  } catch {
    return { boxes: {} };
  }
}

function saveProgress(key: string, progress: Progress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    /* storage may be unavailable (private mode); progress is best-effort. */
  }
}

/**
 * Retrieval-practice quiz with a lightweight Leitner spaced-repetition queue.
 * All progress lives in localStorage only; there is no server (DD-03). The UI
 * is keyboard-operable with live-region feedback for screen readers.
 */
export default function Quiz({ questions, storageKey = DEFAULT_KEY }: QuizProps) {
  const [progress, setProgress] = useState<Progress>({ boxes: {} });
  const [hydrated, setHydrated] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setProgress(loadProgress(storageKey));
    setHydrated(true);
  }, [storageKey]);

  // Order questions by lowest Leitner box first (most due).
  const ordered = useMemo(() => {
    return [...questions].sort(
      (a, b) => (progress.boxes[a.id] ?? 1) - (progress.boxes[b.id] ?? 1),
    );
  }, [questions, progress]);

  if (questions.length === 0) {
    return <p role="status">No quiz questions are available yet.</p>;
  }

  const q = ordered[Math.min(current, ordered.length - 1)];

  function choose(idx: number) {
    if (revealed) return;
    setSelected(idx);
  }

  function submit() {
    if (selected === null || revealed) return;
    const correct = selected === q.answerIndex;
    const box = progress.boxes[q.id] ?? 1;
    const nextBox = correct ? Math.min(5, box + 1) : 1;
    const next: Progress = {
      boxes: { ...progress.boxes, [q.id]: nextBox },
    };
    setProgress(next);
    saveProgress(storageKey, next);
    setRevealed(true);
  }

  function nextQuestion() {
    setSelected(null);
    setRevealed(false);
    setCurrent((c) => (c + 1) % ordered.length);
  }

  function resetProgress() {
    const cleared: Progress = { boxes: {} };
    setProgress(cleared);
    saveProgress(storageKey, cleared);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
  }

  const mastered = ordered.filter((item) => (progress.boxes[item.id] ?? 1) >= 5)
    .length;
  const correct = revealed && selected === q.answerIndex;

  return (
    <section class="quiz" aria-label="Shark knowledge quiz">
      <p class="quiz__progress" role="status" aria-live="polite">
        {hydrated
          ? `Mastered ${mastered} of ${ordered.length} questions`
          : 'Loading your progress\u2026'}
      </p>
      <fieldset class="quiz__question">
        <legend>{q.prompt}</legend>
        {q.choices.map((choice, idx) => {
          const id = `${q.id}-choice-${idx}`;
          const isAnswer = idx === q.answerIndex;
          const showState = revealed && (isAnswer || idx === selected);
          return (
            <div class="quiz__choice" key={id}>
              <input
                type="radio"
                id={id}
                name={`quiz-${q.id}`}
                checked={selected === idx}
                disabled={revealed}
                onChange={() => choose(idx)}
              />
              <label for={id}>
                {choice}
                {showState ? (
                  <span class="quiz__marker">
                    {' '}
                    {isAnswer ? '\u2713 correct' : '\u2717 your answer'}
                  </span>
                ) : null}
              </label>
            </div>
          );
        })}
      </fieldset>
      <div class="quiz__actions">
        {!revealed ? (
          <button type="button" onClick={submit} disabled={selected === null}>
            Check answer
          </button>
        ) : (
          <button type="button" onClick={nextQuestion}>
            Next question
          </button>
        )}
        <button type="button" class="quiz__reset" onClick={resetProgress}>
          Reset progress
        </button>
      </div>
      <p class="quiz__feedback" role="status" aria-live="polite">
        {revealed
          ? `${correct ? 'Correct.' : 'Not quite.'}${
              q.explanation ? ' ' + q.explanation : ''
            }`
          : ''}
      </p>
    </section>
  );
}
