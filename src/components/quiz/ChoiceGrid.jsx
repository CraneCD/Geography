import { useEffect } from "react";
import { Check, X } from "lucide-react";

const LETTERS = "ABCDEFGHI";

/**
 * Multiple-choice answer cards. State comes from the session's `answer`, so a
 * timeout reveals the correct option exactly like a wrong pick does.
 * Keys 1–9 or A–I pick the matching option.
 */
export default function ChoiceGrid({ options, correctId, answer, onAnswer, t, columns }) {
  const locked = Boolean(answer);

  useEffect(() => {
    if (locked) return undefined;
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const byNumber = Number(e.key) - 1;
      const byLetter = LETTERS.indexOf(e.key.toUpperCase());
      const i = e.key.length === 1 ? (byNumber >= 0 ? byNumber : byLetter) : -1;
      if (i >= 0 && i < options.length) {
        const opt = options[i];
        onAnswer({ correct: opt.id === correctId, given: opt.label, givenId: opt.id });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, options, correctId, onAnswer]);

  function stateOf(opt) {
    if (!locked) return "default";
    if (opt.id === correctId) return "correct";
    if (opt.id === answer.givenId) return "wrong";
    return "faded";
  }

  return (
    <div className={`options-grid${columns === 1 ? " options-grid--single" : ""}`} role="group" aria-label={t.answerOptions}>
      {options.map((opt, i) => {
        const state = stateOf(opt);
        return (
          <button
            key={opt.id}
            type="button"
            className={`option-btn option-btn--${state}`}
            disabled={locked}
            onClick={() => onAnswer({ correct: opt.id === correctId, given: opt.label, givenId: opt.id })}
          >
            <span className="option-btn__key" aria-hidden="true">{LETTERS[i]}</span>
            <span className="option-btn__label">
              {state === "correct" && <span className="sr-only">{t.correct} </span>}
              {opt.label}
            </span>
            {state === "correct" && <Check size={20} strokeWidth={2.4} aria-hidden="true" className="option-btn__mark" />}
            {state === "wrong" && <X size={20} strokeWidth={2.4} aria-hidden="true" className="option-btn__mark" />}
          </button>
        );
      })}
    </div>
  );
}
