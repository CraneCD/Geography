import { useState } from "react";

function RegionShape({ shape, ...svgProps }) {
  if (shape.type === "ellipse")
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...svgProps} />;
  if (shape.type === "rect")
    return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx_corner ?? 4} {...svgProps} />;
  return null;
}

export default function BodyQuestion({ question, onAnswer }) {
  const [chosen, setChosen] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [hovered, setHovered] = useState(null);

  const answered = chosen !== null;

  function handleClick(region) {
    if (answered) return;
    const correct = region.id === question.correct.id;
    setChosen(region.id);
    setWasCorrect(correct);
    setTimeout(() => onAnswer(correct), 1200);
  }

  function getFill(region) {
    if (answered) {
      if (region.id === question.correct.id) return "rgba(22,163,74,0.5)";
      if (region.id === chosen) return "rgba(220,38,38,0.4)";
      return "rgba(59,130,246,0.15)";
    }
    if (hovered === region.id) return "rgba(59,130,246,0.35)";
    return "rgba(59,130,246,0.15)";
  }

  function getStroke(region) {
    if (answered) {
      if (region.id === question.correct.id) return "#16a34a";
      if (region.id === chosen) return "#dc2626";
      return "#3b82f6";
    }
    if (hovered === region.id) return "#3b82f6";
    return "#3b82f6";
  }

  function getStrokeOpacity(region) {
    if (answered) return 1;
    if (hovered === region.id) return 1;
    return 0.4;
  }

  const clickedRegion = chosen ? question.allRegions.find((r) => r.id === chosen) : null;

  return (
    <div className="question-card">
      <p className="question-prompt" style={{ textAlign: "center", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
        {question.prompt}
      </p>

      <div className="body-diagram-wrap">
        <svg
          className="body-diagram-svg"
          viewBox="0 0 240 480"
          aria-label={`Body diagram — click to identify ${question.correct.name}`}
          role="img"
        >
          {/* Body silhouette */}
          <g fill="#334155">
            <circle cx="120" cy="42" r="36" />
            <rect x="103" y="77" width="34" height="22" />
            <rect x="58" y="98" width="124" height="143" rx="8" />
            <rect x="20" y="98" width="36" height="118" rx="14" />
            <rect x="184" y="98" width="36" height="118" rx="14" />
            <rect x="58" y="238" width="124" height="40" rx="6" />
            <rect x="63" y="275" width="48" height="195" rx="10" />
            <rect x="129" y="275" width="48" height="195" rx="10" />
          </g>

          {/* Clickable regions */}
          {question.allRegions.map((region) => (
            <RegionShape
              key={region.id}
              shape={region.shape}
              className="body-region"
              fill={getFill(region)}
              stroke={getStroke(region)}
              strokeWidth="1.5"
              strokeOpacity={getStrokeOpacity(region)}
              style={{ cursor: answered ? "default" : "pointer" }}
              onClick={() => handleClick(region)}
              onMouseEnter={() => !answered && setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
              role="button"
              aria-label={region.name}
            />
          ))}
        </svg>
      </div>

      {answered && (
        <p className={`type-feedback--${wasCorrect ? "correct" : "wrong"}`} style={{ textAlign: "center", marginTop: "0.75rem" }}>
          {wasCorrect
            ? `✓ Correct! — ${question.correct.fact}`
            : `✗ That was ${clickedRegion?.name ?? "unknown"}. ${question.correct.name}: ${question.correct.fact}`}
        </p>
      )}
    </div>
  );
}
