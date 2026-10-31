import { useState, useCallback, useEffect, useRef } from "react";
import { useQuizSession, autoAdvanceDelay } from "../../hooks/useQuizSession.js";
import { recordBest } from "../../lib/storage.js";
import { shuffle } from "../../lib/random.js";
import QuestionView from "./QuestionView.jsx";
import AnswerFooter from "./AnswerFooter.jsx";
import SummaryScreen from "./SummaryScreen.jsx";
import { ProgressBar, Timer } from "./HeaderWidgets.jsx";

let reviewSeq = 0;
const reviewCopy = (q) => ({
  ...q,
  key: `${q.key.split("#")[0]}#review${++reviewSeq}`,
  isRetry: false,
  options: q.options ? shuffle(q.options) : q.options,
});

/**
 * Generic quiz screen used by every subject. `module` is the lazily loaded
 * subject module: { buildRound(settings, t), views? }.
 */
export default function QuizScreen({ subjectId, mode, settings, module, t, onExit }) {
  // Settings, mode, and language are fixed for the lifetime of this screen (App re-keys it on change).
  const build = useCallback(() => module.buildRound({ ...settings, mode }, t), [module, settings, mode, t]);

  const onRoundComplete = useCallback(
    ({ correct, total }) => (settings.practice ? false : recordBest(subjectId, mode, settings.difficulty, correct, total)),
    [subjectId, mode, settings.difficulty, settings.practice],
  );

  const session = useQuizSession({
    build,
    timer: settings.timer,
    practice: settings.practice,
    onRoundComplete,
  });
  const { question, idx, questions, answer, done, results, score, timeLeft } = session;
  const [confirmExit, setConfirmExit] = useState(false);
  const cardRef = useRef(null);

  // Move focus to each new question so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (question && question.kind !== "text") cardRef.current?.focus({ preventScroll: true });
  }, [question]);

  const requested = settings.roundSize;
  const firstRoundLength = questions.filter((q) => !q.isRetry).length;

  if (done) {
    return (
      <SummaryScreen
        results={results}
        score={score}
        practice={settings.practice}
        newBest={session.newBest}
        onPlayAgain={() => session.restart()}
        onReview={(missed) => session.restart(missed.map(reviewCopy), { review: true })}
        onChangeMode={onExit}
        t={t}
      />
    );
  }

  if (!question) {
    return (
      <main className="game-screen">
        <p className="notice" role="alert">{t.shortRound(0)}</p>
        <button type="button" className="btn btn--secondary" onClick={onExit}>{t.backToModes}</button>
      </main>
    );
  }

  function handleBack() {
    if (idx === 0 && !answer) onExit();
    else setConfirmExit(true);
  }

  const delay = answer ? autoAdvanceDelay(question, answer) : null;

  return (
    <main className="game-screen">
      <div className="game-header">
        <button type="button" onClick={handleBack} className="back-btn">{t.backToModes}</button>
        <ProgressBar current={idx + 1} total={questions.length} score={score.correct} t={t} />
        {timeLeft != null && <Timer left={timeLeft} total={settings.timer} t={t} />}
        {settings.practice && <span className="practice-badge">{t.practiceMode}</span>}
      </div>

      {confirmExit && (
        <div className="confirm-exit-banner" role="alertdialog" aria-label={t.quitPrompt}>
          <span>{t.quitPrompt}</span>
          <button type="button" className="btn btn--danger-sm" onClick={onExit}>{t.quitYes}</button>
          <button type="button" className="btn btn--secondary-sm" onClick={() => setConfirmExit(false)} autoFocus>{t.quitNo}</button>
        </div>
      )}

      {idx === 0 && !session.review && firstRoundLength < requested && (
        <p className="notice">{t.shortRound(firstRoundLength)}</p>
      )}

      <div className="question-type-label">
        {t.typeLabels[question.type] ?? question.type}
        {question.isRetry && <span className="retry-badge">{t.retryBadge}</span>}
      </div>

      <div ref={cardRef} tabIndex={-1} className="question-focus" aria-live="off">
        <QuestionView
          key={`${question.key}:${idx}`}
          question={question}
          answer={answer}
          onAnswer={session.submit}
          t={t}
          views={module.views}
        />
      </div>

      {answer && (
        <AnswerFooter
          key={`footer:${idx}`}
          question={question}
          answer={answer}
          onNext={session.next}
          isLast={idx + 1 >= questions.length}
          autoAdvance={delay != null}
          t={t}
        />
      )}
    </main>
  );
}
