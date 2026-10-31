import { useState, useRef, useEffect, useId } from "react";

const FILTERS = {
  numeric: /[^0-9\-−.,/]/g,
  fraction: /[^0-9\-−/]/g,
};

/** Free-text answer box used by every "expert" / typed question. */
export default function AnswerInput({ placeholder, inputMode, answer, onSubmit, t }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);
  const id = useId();
  const locked = Boolean(answer);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  function submit(e) {
    e.preventDefault();
    if (locked || !value.trim()) return;
    onSubmit(value.trim());
  }

  const filter = FILTERS[inputMode];
  const stateClass = locked ? (answer.correct ? " type-input--correct" : " type-input--wrong") : "";

  return (
    <form className="type-answer-wrap" onSubmit={submit}>
      <label htmlFor={id} className="sr-only">{t.yourAnswer}</label>
      <input
        id={id}
        ref={ref}
        type="text"
        inputMode={inputMode ? "decimal" : "text"}
        value={value}
        onChange={(e) => setValue(filter ? e.target.value.replace(filter, "") : e.target.value)}
        disabled={locked}
        placeholder={placeholder ?? t.typeAnswer}
        className={`type-input${stateClass}`}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      {!locked && (
        <button type="submit" className="btn btn--primary type-submit" disabled={!value.trim()}>
          {t.submit}
        </button>
      )}
    </form>
  );
}
