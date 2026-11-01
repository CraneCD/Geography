import { useState } from "react";

/** Image that never reveals the answer through alt text before it is answered. */
function QuizImage({ media, revealed, revealLabel, t, className = "quiz-img" }) {
  const [status, setStatus] = useState("loading");
  if (!media?.src || status === "failed") {
    return <div className="quiz-img-placeholder" role="img" aria-label={t.imageUnavailable}>{t.imageUnavailable}</div>;
  }
  return (
    <div className={`quiz-img-frame${status === "loading" ? " quiz-img-frame--loading" : ""}`}>
      <img
        src={media.src}
        width={media.width}
        height={media.height}
        alt={revealed ? revealLabel ?? "" : ""}
        className={className}
        referrerPolicy="no-referrer"
        decoding="async"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("failed")}
      />
    </div>
  );
}

function Flag({ src, alt, className }) {
  if (!src) return <div className={`${className} flag-missing`} aria-hidden="true" />;
  return <img src={src} alt={alt} className={className} decoding="async" />;
}

const SHAPE_COLORS = { pending: "var(--primary)", correct: "var(--correct)", wrong: "var(--wrong)" };

export function ShapeSvg({ d, state = "pending", className = "shape-svg" }) {
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden="true">
      <path d={d} fill={SHAPE_COLORS[state]} stroke="var(--shape-stroke)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Renders the visual part of a question (flag, outline, photo, element tile, sequence).
 * `revealed` is true once the question has been answered.
 */
export default function Media({ media, revealed, answer, correctLabel, t }) {
  if (!media) return null;
  switch (media.kind) {
    case "flag":
      // Alt text stays empty for the "which flag is this?" question so it can't leak the answer.
      return (
        <div className="flag-wrap">
          <div className="taped">
            <span className="taped__tape" aria-hidden="true" />
            <Flag src={media.src} alt={revealed ? correctLabel : media.alt} className="flag-img" />
          </div>
        </div>
      );
    case "flagThumb":
      return (
        <div className="flag-wrap flag-wrap--thumb">
          <Flag src={media.src} alt={media.alt} className="flag-thumb" />
        </div>
      );
    case "shape":
      return (
        <div className="shape-wrap">
          <ShapeSvg d={media.d} state={revealed ? (answer?.correct ? "correct" : "wrong") : "pending"} />
        </div>
      );
    case "image":
      return (
        <div className="quiz-img-wrap">
          <div className="taped taped--photo">
            <span className="taped__tape" aria-hidden="true" />
            <QuizImage media={media} revealed={revealed} revealLabel={correctLabel} t={t} />
          </div>
        </div>
      );
    case "element":
      return (
        <div className="element-cell" aria-hidden="true">
          <span className="element-cell__number">{media.number ?? ""}</span>
          <span className="element-cell__symbol">{media.symbol ?? "?"}</span>
        </div>
      );
    case "sequence":
      return (
        <ol className="sequence" aria-label={media.terms.join(", ") + ", ?"}>
          {media.terms.map((term, i) => (
            <li key={i} className="sequence__term">{term}</li>
          ))}
          <li className="sequence__term sequence__term--blank">{revealed ? correctLabel : "?"}</li>
        </ol>
      );
    case "clock":
      return <ClockFace h={media.h} m={media.m} label={t?.logic?.clockLabel} />;
    case "statements":
      return (
        <ul className="statements">
          {media.lines.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      );
    default:
      return null;
  }
}

/** Analogue clock. The hour hand moves continuously with the minutes, like a real clock. */
function ClockFace({ h, m, label }) {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minuteAngle = m * 6;
  const hand = (angle, length, width, cls) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return <line className={cls} x1="100" y1="100" x2={100 + length * Math.cos(rad)} y2={100 + length * Math.sin(rad)} strokeWidth={width} strokeLinecap="round" />;
  };
  return (
    <div className="clock-wrap">
      <svg viewBox="0 0 200 200" className="clock" role="img" aria-label={label}>
        <circle cx="100" cy="100" r="92" className="clock__face" />
        {Array.from({ length: 60 }, (_, i) => {
          const rad = (i * 6 * Math.PI) / 180;
          const inner = i % 5 === 0 ? 80 : 86;
          return (
            <line key={i} className="clock__tick" strokeWidth={i % 5 === 0 ? 3 : 1}
              x1={100 + inner * Math.sin(rad)} y1={100 - inner * Math.cos(rad)}
              x2={100 + 90 * Math.sin(rad)} y2={100 - 90 * Math.cos(rad)} />
          );
        })}
        {hand(hourAngle, 46, 7, "clock__hand clock__hand--hour")}
        {hand(minuteAngle, 72, 4, "clock__hand clock__hand--minute")}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const rad = (n * 30 * Math.PI) / 180;
          return <text key={n} className="clock__num" x={100 + 66 * Math.sin(rad)} y={100 - 66 * Math.cos(rad)} textAnchor="middle" dominantBaseline="central">{n}</text>;
        })}
        <circle cx="100" cy="100" r="5" className="clock__pin" />
      </svg>
    </div>
  );
}

export { QuizImage, Flag };
