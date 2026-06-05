import { useState } from "react";

const FLAG_SOURCES = [
  (code) => `https://flagcdn.com/w320/${code.toLowerCase()}.png`,
  (code) => `https://flagsapi.com/${code.toUpperCase()}/flat/256.png`,
  (code) => `https://raw.githubusercontent.com/hampusborgos/country-flags/main/png250px/${code.toLowerCase()}.png`,
];

function emojiFlag(code) {
  return [...code.toUpperCase()].map((c) =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
  ).join("");
}

export default function FlagImage({ code, countryName, className, style }) {
  const [srcIdx, setSrcIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  function handleError() {
    if (srcIdx + 1 < FLAG_SOURCES.length) {
      setSrcIdx(srcIdx + 1);
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <div className={`flag-emoji-fallback ${className || ""}`} style={style} aria-label={`Flag of ${countryName}`}>
        <span style={{ fontSize: "4rem", lineHeight: 1 }}>{emojiFlag(code)}</span>
        <span style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.25rem" }}>{countryName}</span>
      </div>
    );
  }

  return (
    <img
      src={FLAG_SOURCES[srcIdx](code)}
      alt={`Flag of ${countryName}`}
      className={className}
      style={style}
      onError={handleError}
    />
  );
}
