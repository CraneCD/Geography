import { useCallback, Suspense } from "react";
import Media, { QuizImage, Flag } from "./Media.jsx";
import ChoiceGrid from "./ChoiceGrid.jsx";
import AnswerInput from "./AnswerInput.jsx";
import { matchesAnswer } from "../../lib/text.js";

function Prompt({ question }) {
  return (
    <>
      <h2 className="question-prompt">{question.prompt}</h2>
      {question.expression && <p className="math-expression">{question.expression}</p>}
    </>
  );
}

function ChoiceQuestion({ question, answer, onAnswer, t }) {
  return (
    <>
      <Prompt question={question} />
      <Media media={question.media} revealed={Boolean(answer)} answer={answer} correctLabel={question.correctLabel} t={t} />
      <ChoiceGrid
        options={question.options}
        correctId={question.correctId}
        answer={answer}
        onAnswer={onAnswer}
        t={t}
        columns={question.options.length <= 2 ? 1 : 2}
      />
    </>
  );
}

function TextQuestion({ question, answer, onAnswer, t }) {
  const onSubmit = useCallback(
    (value) => {
      const correct = question.check
        ? question.check(value)
        : matchesAnswer(value, question.accepted, question.match);
      onAnswer({ correct, given: value });
    },
    [question, onAnswer],
  );
  return (
    <>
      <Prompt question={question} />
      <Media media={question.media} revealed={Boolean(answer)} answer={answer} correctLabel={question.correctLabel} t={t} />
      <AnswerInput placeholder={question.placeholder} inputMode={question.inputMode} answer={answer} onSubmit={onSubmit} t={t} />
    </>
  );
}

function CompareCard({ item, state, verdict, revealed, disabled, onClick, t }) {
  return (
    <button
      type="button"
      className={`compare-card${state ? ` compare-card--${state}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {item.media?.kind === "flag" && <Flag src={item.media.src} alt="" className="compare-flag-img" />}
      {item.media?.kind === "image" && <QuizImage media={item.media} revealed revealLabel={item.label} t={t} className="compare-img" />}
      <span className="compare-name">{item.label}</span>
      <span className={revealed ? "compare-value" : "compare-unknown"}>{revealed ? item.value : "?"}</span>
      {revealed && <span className="compare-verdict">{verdict}</span>}
    </button>
  );
}

function CompareQuestion({ question, answer, onAnswer, t }) {
  const revealed = Boolean(answer);
  const [a, b] = question.items;
  const card = (item) => {
    const isWinner = item.id === question.correctId;
    const state = !revealed ? null : isWinner ? "correct" : item.id === answer.givenId ? "wrong" : "other";
    return (
      <CompareCard
        item={item}
        state={state}
        verdict={isWinner ? question.verdicts.correct : question.verdicts.other}
        revealed={revealed}
        disabled={revealed}
        onClick={() => onAnswer({ correct: isWinner, given: item.label, givenId: item.id })}
        t={t}
      />
    );
  };
  return (
    <>
      <Prompt question={question} />
      <div className="compare-grid">
        {card(a)}
        <div className="compare-vs" aria-hidden="true">{t.vs}</div>
        {card(b)}
      </div>
    </>
  );
}

const BUILT_IN = { choice: ChoiceQuestion, text: TextQuestion, compare: CompareQuestion };

/** Renders any question; subjects can supply extra `views` for custom kinds (map, angle). */
export default function QuestionView({ question, answer, onAnswer, t, views }) {
  const View = BUILT_IN[question.kind] ?? views?.[question.kind];
  if (!View) return <p role="alert">Unsupported question type: {question.kind}</p>;
  return (
    <div className="question-card">
      <Suspense fallback={<p className="notice" role="status">{t.loading}</p>}>
        <View question={question} answer={answer} onAnswer={onAnswer} t={t} />
      </Suspense>
    </div>
  );
}
