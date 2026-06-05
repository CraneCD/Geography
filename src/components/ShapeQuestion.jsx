import { useState, useMemo } from "react";
import { feature } from "topojson-client";
import { geoPath, geoMercator } from "d3-geo";
import { ALPHA2_TO_NUMERIC } from "../data/countryIds";
import topology from "world-atlas/countries-110m.json";

const W = 400;
const H = 300;
const PAD = 24;

function buildPath(topology, numericId) {
  const countries = feature(topology, topology.objects.countries);
  const f = countries.features.find((f) => String(f.id) === String(numericId));
  if (!f) return null;

  const projection = geoMercator().fitExtent([[PAD, PAD], [W - PAD, H - PAD]], f);
  const pathGen = geoPath().projection(projection);
  return pathGen(f);
}

export default function ShapeQuestion({ question, onAnswer, isExpert }) {
  const [selected, setSelected] = useState(null);

  const pathData = useMemo(() => {
    const numId = ALPHA2_TO_NUMERIC[question.correct.code];
    if (!numId) return null;
    return buildPath(topology, numId);
  }, [question.correct.code]);

  function choose(option) {
    if (selected) return;
    setSelected(option);
    setTimeout(() => onAnswer(option.code === question.correct.code), 900);
  }

  function optionState(option) {
    if (!selected) return "";
    if (option.code === question.correct.code) return "correct";
    if (option.code === selected.code) return "wrong";
    return "faded";
  }

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>

      <div className="shape-wrap" aria-label={`Outline of ${selected ? question.correct.name : "a country"}`}>
        {pathData ? (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="shape-svg"
            role="img"
            aria-hidden="true"
          >
            <path
              d={pathData}
              fill={
                selected
                  ? selected.code === question.correct.code
                    ? "#16a34a"
                    : "#dc2626"
                  : "#3b82f6"
              }
              stroke="#1e3a8a"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="shape-loading" role="status">Loading shape…</div>
        )}
      </div>

      <div className="options-grid" role="group" aria-label="Country name options">
        {question.options.map((opt) => {
          const state = optionState(opt);
          return (
            <button
              key={opt.code}
              onClick={() => choose(opt)}
              className={`option-btn option-btn--${state || "default"}`}
              aria-disabled={!!selected}
              aria-label={`${opt.name}${state === "correct" ? " — correct" : state === "wrong" ? " — incorrect" : ""}`}
            >
              {state === "correct" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
