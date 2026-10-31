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
          <Flag src={media.src} alt={revealed ? correctLabel : media.alt} className="flag-img" />
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
          <QuizImage media={media} revealed={revealed} revealLabel={correctLabel} t={t} />
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
    default:
      return null;
  }
}

export { QuizImage, Flag };
