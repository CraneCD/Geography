import { useState } from "react";
import { lazy, Suspense } from "react";

// Accurate flags from flagcdn.com (Wikipedia-sourced). Falls back to bundled SVG,
// then to emoji if both fail (e.g. in network-restricted environments).

function cdnUrl(code) {
  return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
}

// Bundled SVG fallback — simplified but always available offline
function loadBundledFlag(code) {
  return lazy(() =>
    import(`country-flag-icons/react/3x2`)
      .then((mod) => {
        const Flag = mod[code];
        if (!Flag) throw new Error("no flag");
        return { default: Flag };
      })
      .catch(() => ({ default: () => <EmojiFallback code={code} /> }))
  );
}

function EmojiFallback({ code }) {
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

const bundledCache = {};
function getBundledFlag(code) {
  if (!bundledCache[code]) bundledCache[code] = loadBundledFlag(code);
  return bundledCache[code];
}

function BundledFlag({ code, countryName, className, style }) {
  const FlagComponent = getBundledFlag(code);
  return (
    <Suspense fallback={<div className={className} style={{ ...style, background: "var(--surface2)" }} />}>
      <FlagComponent title={countryName} className={className} style={{ ...style, display: "block" }} />
    </Suspense>
  );
}

export default function FlagImage({ code, countryName, className, style }) {
  const [cdnFailed, setCdnFailed] = useState(false);

  if (cdnFailed) {
    return <BundledFlag code={code} countryName={countryName} className={className} style={style} />;
  }

  return (
    <img
      src={cdnUrl(code)}
      alt={countryName ? `Flag of ${countryName}` : `Flag: ${code}`}
      className={className}
      style={style}
      onError={() => setCdnFailed(true)}
      loading="lazy"
    />
  );
}
