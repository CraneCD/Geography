import { lazy, Suspense } from "react";

// Lazy-load each flag SVG component on demand so the full set isn't in the initial bundle
function loadFlag(code) {
  return lazy(() =>
    import(`country-flag-icons/react/3x2`)
      .then((mod) => {
        const Flag = mod[code];
        if (!Flag) throw new Error("no flag");
        return { default: Flag };
      })
      .catch(() => ({ default: () => <FlagFallback code={code} /> }))
  );
}

function FlagFallback({ code }) {
  // Unicode regional indicator letters — renders as flag emoji where supported,
  // falls back to two-letter code. Never shows the country name.
  const emoji = [...code.toUpperCase()].map((c) =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
  ).join("");
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "3.5rem",
        background: "var(--surface2)",
        borderRadius: "inherit",
      }}
      aria-label={`Flag: ${code}`}
    >
      {emoji}
    </div>
  );
}

// Cache flag components so we don't recreate lazy() on every render
const flagCache = {};
function getFlag(code) {
  if (!flagCache[code]) flagCache[code] = loadFlag(code);
  return flagCache[code];
}

export default function FlagImage({ code, countryName, className, style }) {
  const FlagComponent = getFlag(code);

  return (
    <Suspense
      fallback={
        <div
          className={className}
          style={{ ...style, background: "var(--surface2)", borderRadius: 8 }}
          aria-label={`Flag of ${countryName}`}
        />
      }
    >
      <FlagComponent
        title={countryName}
        className={className}
        style={{ ...style, display: "block" }}
      />
    </Suspense>
  );
}
