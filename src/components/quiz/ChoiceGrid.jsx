import { useEffect } from "react";

/**
 * Multiple-choice buttons. State comes from the session's `answer`, so a timeout
 * reveals the correct option exactly like a wrong click does.
 * Keys 1–9 pick the matching option.
 */
export default function ChoiceGrid({ options, correctId, answer, onAnswer, t, columns }) {
  const locked = Boolean(answer);

  useEffect(() => {
    if (locked) return undefined;
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) {
        const opt = options[n - 1];
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
            <span className="option-btn__key" aria-hidden="true">{i + 1}</span>
            {state === "correct" && <span className="sr-only">{t.correct} </span>}
            {state === "correct" && <span aria-hidden="true">✓ </span>}
            {state === "wrong" && <span aria-hidden="true">✗ </span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
