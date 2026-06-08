import { useState } from "react";

const SVG_W = 300;
const SVG_H = 280;
const VX = 150;
const VY = 200;
const RAY_LEN = 140;
const ARC_R = 40;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function rayEndpoint(deg) {
  const r = toRad(deg);
  return {
    x: VX + RAY_LEN * Math.cos(r),
    y: VY - RAY_LEN * Math.sin(r),
  };
}

// SVG arc path from angle start (0°) to angle end (degrees), counterclockwise
function arcPath(degrees) {
  if (degrees === 0) return "";
  // Arc goes from base ray (0°) counterclockwise to the angle ray
  const startX = VX + ARC_R; // 0 degrees
  const startY = VY;
  const endRad = toRad(degrees);
  const endX = VX + ARC_R * Math.cos(endRad);
  const endY = VY - ARC_R * Math.sin(endRad);
  // large-arc-flag: 1 if angle > 180
  const largeArc = degrees > 180 ? 1 : 0;
  // sweep-flag: 0 = counterclockwise in SVG coords (because y is flipped, CCW in math = CCW visually)
  return `M ${startX} ${startY} A ${ARC_R} ${ARC_R} 0 ${largeArc} 0 ${endX} ${endY}`;
}

// Mid-angle label position
function arcLabelPos(degrees) {
  const mid = degrees / 2;
  const r = toRad(mid);
  const labelR = ARC_R + 16;
  return {
    x: VX + labelR * Math.cos(r),
    y: VY - labelR * Math.sin(r),
  };
}

export default function AngleQuestion({ question, onAnswer, s }) {
  const { degrees, tolerance = 10 } = question;
  const [guess, setGuess] = useState(45);
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);

  const baseEnd = rayEndpoint(0);
  const angleEnd = rayEndpoint(degrees);
  const guessEnd = rayEndpoint(guess);

  function submit() {
    if (submitted) return;
    const diff = Math.abs(guess - degrees);
    // Wrap-around tolerance (e.g., 359 vs 1)
    const dist = Math.min(diff, 360 - diff);
    const correct = dist <= tolerance;
    setWasCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1600);
  }

  const arcLabel = submitted ? `${degrees}°` : "?";
  const labelPos = arcLabelPos(degrees);

  const correctFeedback = s?.logicCorrect ?? "Correct!";
  const wrongFeedback = s?.logicWrong
    ? s.logicWrong(`${degrees}°`)
    : `The angle was ${degrees}°`;
  const submitLabel = s?.logicSubmit ?? s?.submitBtn ?? "Submit";

  return (
    <div className="question-card">
      <p className="question-prompt">
        {s?.anglePrompt ?? "Estimate this angle (in degrees):"}
      </p>

      <div style={{ display: "flex", justifyContent: "center", margin: "0.75rem 0" }}>
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ maxWidth: "100%", overflow: "visible" }}
          aria-label={submitted ? `Angle of ${degrees} degrees` : "Mystery angle"}
          role="img"
        >
          {/* Vertex dot */}
          <circle cx={VX} cy={VY} r={4} fill="var(--text-muted)" />

          {/* Base ray — horizontal right */}
          <line
            x1={VX}
            y1={VY}
            x2={baseEnd.x}
            y2={baseEnd.y}
            stroke="#94a3b8"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Angle ray — the actual angle */}
          <line
            x1={VX}
            y1={VY}
            x2={angleEnd.x}
            y2={angleEnd.y}
            stroke="#3b82f6"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Guess ray — shown after submission */}
          {submitted && (
            <line
              x1={VX}
              y1={VY}
              x2={guessEnd.x}
              y2={guessEnd.y}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          )}

          {/* Arc showing the angle */}
          {degrees > 0 && (
            <path
              d={arcPath(degrees)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              opacity={0.6}
            />
          )}

          {/* Arc label */}
          <text
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={submitted ? "#3b82f6" : "var(--text-muted)"}
            fontSize={submitted ? "13" : "14"}
            fontWeight={submitted ? "700" : "500"}
          >
            {arcLabel}
          </text>

          {/* Legend after submission */}
          {submitted && (
            <>
              <circle cx={VX - 60} cy={VY + 30} r={4} fill="#3b82f6" />
              <text x={VX - 52} y={VY + 34} fill="#3b82f6" fontSize="11">
                actual
              </text>
              <circle cx={VX + 20} cy={VY + 30} r={4} fill="#f59e0b" />
              <text x={VX + 28} y={VY + 34} fill="#f59e0b" fontSize="11">
                your guess
              </text>
            </>
          )}
        </svg>
      </div>

      {!submitted && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            margin: "0.5rem 0 1rem",
          }}
        >
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "0.02em",
              minWidth: "4rem",
              textAlign: "center",
            }}
            aria-live="polite"
            aria-label={`Current guess: ${guess} degrees`}
          >
            {guess}°
          </div>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={guess}
            onChange={(e) => setGuess(Number(e.target.value))}
            style={{
              width: "240px",
              accentColor: "var(--primary)",
              cursor: "pointer",
            }}
            aria-label="Angle guess slider"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "240px",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
            }}
          >
            <span>0°</span>
            <span>180°</span>
            <span>359°</span>
          </div>
        </div>
      )}

      {submitted && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "0.75rem",
            fontSize: "1rem",
            color: "var(--text-muted)",
          }}
        >
          Your guess: <strong style={{ color: "#f59e0b" }}>{guess}°</strong>
          {" · "}
          Actual: <strong style={{ color: "#3b82f6" }}>{degrees}°</strong>
        </div>
      )}

      {!submitted ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={submit}
            className="btn btn--primary type-submit"
            style={{ minWidth: "8rem" }}
          >
            {submitLabel}
          </button>
        </div>
      ) : (
        <div
          className={`type-feedback ${wasCorrect ? "type-feedback--correct" : "type-feedback--wrong"}`}
          aria-live="assertive"
          style={{ textAlign: "center" }}
        >
          {wasCorrect ? correctFeedback : wrongFeedback}
        </div>
      )}

      {submitted && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.5rem 1rem",
            background: "var(--surface2)",
            borderRadius: "var(--radius)",
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            textAlign: "center",
          }}
          aria-live="polite"
        >
          Tolerance: ±{tolerance}°
        </div>
      )}
    </div>
  );
}
