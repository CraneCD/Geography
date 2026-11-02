import { useState, useCallback, useEffect, useRef } from "react";
import { recordAnswer } from "../../lib/stats.js";
import { ArrowLeft } from "lucide-react";
import { useQuizSession, autoAdvanceDelay } from "../../hooks/useQuizSession.js";
import { recordBest, recordActivity } from "../../lib/storage.js";
import { shuffle } from "../../lib/random.js";
import QuestionView from "./QuestionView.jsx";
import AnswerFooter from "./AnswerFooter.jsx";
import SummaryScreen from "./SummaryScreen.jsx";
import { ProgressSegments, Timer } from "./HeaderWidgets.jsx";
import Icon from "../Icon.jsx";

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
    ({ correct, total }) => {
      recordActivity(total);
      return settings.practice ? false : recordBest(subjectId, mode, settings.difficulty, correct, total);
    },
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

  // Per-question statistics (see src/lib/stats.js): when each question was shown, and its result.
  const shownAt = useRef(0);
  useEffect(() => {
    if (question) shownAt.current = performance.now();
  }, [question]);
  useEffect(() => {
    if (!answer || !question) return;
    recordAnswer({ subject: subjectId, difficulty: settings.difficulty, question, correct: answer.correct, ms: performance.now() - shownAt.current });
    // Only when a new answer arrives; `question` is the one it belongs to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

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
      <main className="page page--narrow">
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
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <main className="page page--narrow game">
      <div className="topbar game__bar">
        <button type="button" onClick={handleBack} className="back-btn">
          <ArrowLeft size={16} aria-hidden="true" /> {t.backToModes}
        </button>
        <span className="game__meta" aria-hidden="true">
          {t.questionShort(idx + 1, questions.length)} · {t.scoreLabel.toUpperCase()} {pad(score.correct)}
        </span>
        {timeLeft != null && <Timer left={timeLeft} t={t} />}
      </div>

      <ProgressSegments questions={questions} results={results} idx={idx} t={t} />

      {confirmExit && (
        <div className="confirm-exit card" role="alertdialog" aria-label={t.quitPrompt}>
          <span>{t.quitPrompt}</span>
          <div className="confirm-exit__actions">
            <button type="button" className="btn btn--danger btn--sm" onClick={onExit}>{t.quitYes}</button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setConfirmExit(false)} autoFocus>{t.quitNo}</button>
          </div>
        </div>
      )}

      {idx === 0 && !session.review && firstRoundLength < requested && (
        <p className="notice">{t.shortRound(firstRoundLength)}</p>
      )}

      <p className="kicker game__type">
        <Icon name={question.type} size={16} />
        <span>{t.typeLabels[question.type] ?? question.type} · {t.difficulties[settings.difficulty]}</span>
        {settings.practice && <span className="badge">{t.practiceMode}</span>}
        {question.isRetry && <span className="badge">{t.retryBadge}</span>}
      </p>

      <div ref={cardRef} tabIndex={-1} className="question-focus">
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
