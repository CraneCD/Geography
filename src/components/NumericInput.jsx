import { useRef, useEffect } from "react";

export default function NumericInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Type answer…",
  submitted = false,
  wasCorrect = null,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  function handleKeyDown(e) {
    if (e.key === "Enter") onSubmit();
  }

  function handleChange(e) {
    const raw = e.target.value;
    // Allow digits, minus sign (leading), slash (fractions), decimal point
    const filtered = raw.replace(/[^0-9\-./]/g, "");
    onChange(filtered);
  }

  const inputClass = [
    "type-input",
    submitted && wasCorrect === true ? "type-input--correct" : "",
    submitted && wasCorrect === false ? "type-input--wrong" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className={inputClass}
      aria-label="Numeric answer"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
    />
  );
}
