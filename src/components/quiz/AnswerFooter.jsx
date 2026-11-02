import { useEffect, useRef } from "react";
import { CircleCheck, CircleX, ArrowRight, ExternalLink, BookOpen } from "lucide-react";
import { Flag, ShapeSvg } from "./Media.jsx";

/**
 * Feedback shown after every answer: verdict, correct answer, explanation /
 * fun fact, image credit, and a Next button (Enter also works).
 */
export default function AnswerFooter({ question, answer, onNext, isLast, autoAdvance, t }) {
  const nextRef = useRef(null);

  useEffect(() => {
    // Typed answers keep focus in the (now disabled) input: move it to Next.
    if (!autoAdvance) nextRef.current?.focus({ preventScroll: true });
  }, [autoAdvance]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext]);

  const page = question.media?.page;
  // What the player actually picked, when it was wrong (e.g. "Lisbon is the capital of Portugal").
  const picked = !answer.correct && answer.givenId != null
    ? (question.options ?? question.items ?? []).find((o) => o.id === answer.givenId)
    : null;
  const whyNot = picked?.whyNot;
  const credit = question.media?.credit;
  const creditText = [credit?.author, credit?.license].filter(Boolean).join(" · ");

  return (
    <div className="answer-footer">
      <div className={`feedback card ${answer.correct ? "feedback--correct" : "feedback--wrong"}`}>
        {answer.correct
          ? <CircleCheck size={28} strokeWidth={2} aria-hidden="true" className="feedback__icon" />
          : <CircleX size={28} strokeWidth={2} aria-hidden="true" className="feedback__icon" />}
        <p className="feedback__text" role="status">
          {answer.correct ? (
            <strong className="feedback__verdict">{t.correct}</strong>
          ) : (
            <>
              {answer.timedOut && <strong className="feedback__verdict">{t.timeUp} </strong>}
              {t.answerWas} <strong>{question.correctLabel}</strong>
            </>
          )}
        </p>
        <button ref={nextRef} type="button" className="btn btn--primary next-btn" onClick={onNext}>
          {isLast ? t.seeResults : t.next}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>

      {(whyNot || question.steps || question.explanation || question.note) && (
        <div className="explanation">
          {whyNot && (
            <div className="why-not">
              {whyNot.media?.kind === "flag" && <Flag src={whyNot.media.src} alt="" className="why-not__flag" />}
              {whyNot.media?.kind === "shape" && <ShapeSvg d={whyNot.media.d} state="wrong" className="why-not__shape" />}
              {whyNot.media?.kind === "image" && (
                <img src={whyNot.media.src} alt="" className="why-not__img" loading="lazy" decoding="async" />
              )}
              <p><strong>{t.youChose(picked.label)}</strong> {whyNot.text}</p>
            </div>
          )}
          {question.steps && (
            <>
              <strong className="explanation__title">{t.steps}</strong>
              <ol className="explanation__steps">
                {question.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </>
          )}
          {question.explanation && <p>{question.explanation}</p>}
          {question.note && <p>{question.note}</p>}
        </div>
      )}

      {(question.source || page) && (
        <div className="answer-links">
          {question.source && (
            <a className="learn-more" href={question.source} target="_blank" rel="noreferrer noopener">
              <BookOpen size={14} aria-hidden="true" /> {t.learnMore}
            </a>
          )}
          {page && (
            <a className="image-credit" href={page} target="_blank" rel="noreferrer noopener">
              {t.imageCredit}{creditText ? `: ${creditText}` : ""} <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
