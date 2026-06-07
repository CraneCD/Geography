import { useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { ALPHA2_TO_NUMERIC } from "../data/countryIds";
import topology from "world-atlas/countries-110m.json";

export default function LocateQuestion({ question, onAnswer }) {
  const [clicked, setClicked] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);

  const correctNumeric = String(ALPHA2_TO_NUMERIC[question.correct.code]);

  const handleClick = useCallback((geo) => {
    if (answered) return;
    const clickedCode = String(geo.id);
    setClicked(clickedCode);
    setWasCorrect(clickedCode === correctNumeric);
    setAnswered(true);
  }, [answered, correctNumeric]);

  function geoFill(geo) {
    const numId = String(geo.id);
    if (!answered) return "#d1d5db";
    if (numId === correctNumeric) return "#16a34a";
    if (numId === clicked && clicked !== correctNumeric) return "#dc2626";
    return "#d1d5db";
  }

  function geoStroke(geo) {
    const numId = String(geo.id);
    if (answered && (numId === correctNumeric || numId === clicked)) return "#fff";
    return "#9ca3af";
  }

  return (
    <div className="question-card locate-card">
      <p className="question-prompt">{question.prompt}</p>
      <p className="locate-hint">Click the correct country. Use scroll or pinch to zoom.</p>

      <div className="map-container" role="application" aria-label={`World map. Find ${question.correct.name}.`}>
        <ComposableMap projection="geoNaturalEarth1" style={{ width: "100%", height: "100%" }}>
          <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
            <Geographies geography={topology} key={answered ? "answered" : "active"}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleClick(geo)}
                    tabIndex={answered ? -1 : 0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(geo); }}
                    aria-label={geo.properties?.name || "country"}
                    style={{
                      default: { fill: geoFill(geo), stroke: geoStroke(geo), strokeWidth: 0.5, outline: "none" },
                      hover: { fill: answered ? geoFill(geo) : "#93c5fd", stroke: geoStroke(geo), strokeWidth: 0.5, outline: "none" },
                      pressed: { fill: geoFill(geo), outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {answered && (
        <div className="locate-footer">
          <div
            className={`locate-feedback ${wasCorrect ? "locate-feedback--correct" : "locate-feedback--wrong"}`}
            aria-live="assertive"
          >
            {wasCorrect
              ? `✓ Correct! That's ${question.correct.name}.`
              : `✗ That was ${question.correct.name} — highlighted in green.`}
          </div>
          <button className="btn btn--primary locate-next-btn" onClick={() => onAnswer(wasCorrect)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
