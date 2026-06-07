import { useState } from "react";
import { lazy, Suspense } from "react";

function cdnUrl(code) {
  return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
}

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

// Neutral placeholder shown while the CDN image is in flight — no text, no alt visible
function LoadingPlaceholder({ className, style }) {
  return (
    <div
      className={className}
      style={{ ...style, background: "var(--surface2)", borderRadius: 8 }}
      aria-hidden="true"
    />
  );
}

export default function FlagImage({ code, countryName, className, style }) {
  const [cdnFailed, setCdnFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (cdnFailed) {
    return <BundledFlag code={code} countryName={countryName} className={className} style={style} />;
  }

  return (
    <>
      {!loaded && <LoadingPlaceholder className={className} style={style} />}
      <img
        src={cdnUrl(code)}
        // Use empty alt while loading so browsers don't show the name as placeholder text.
        // Set the real alt only once loaded so screen readers still get it.
        alt={loaded && countryName ? `Flag of ${countryName}` : ""}
        className={className}
        style={{ ...style, display: loaded ? undefined : "none" }}
        onLoad={() => setLoaded(true)}
        onError={() => setCdnFailed(true)}
      />
    </>
  );
}
