import { useState, useEffect } from "react";

const WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const imgCache = new Map();

async function fetchWikiImage(wikiTitle) {
  if (imgCache.has(wikiTitle)) return imgCache.get(wikiTitle);
  const res = await fetch(WIKI_API + encodeURIComponent(wikiTitle));
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  const url = data?.originalimage?.source ?? data?.thumbnail?.source ?? null;
  imgCache.set(wikiTitle, url);
  return url;
}

function WikiImage({ wikiTitle, alt }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | loaded | failed

  useEffect(() => {
    if (!wikiTitle) { setStatus("failed"); return; }
    let cancelled = false;
    setImgSrc(null);
    setStatus("loading");
    fetchWikiImage(wikiTitle)
      .then((url) => {
        if (cancelled) return;
        if (url) { setImgSrc(url); setStatus("loaded"); }
        else setStatus("failed");
      })
      .catch(() => { if (!cancelled) setStatus("failed"); });
    return () => { cancelled = true; };
  }, [wikiTitle]);

  if (status === "loaded") {
    return (
      <img
        src={imgSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        className="science-img"
        onError={() => setStatus("failed")}
      />
    );
  }

  return (
    <div className="science-img-placeholder">
      {status === "failed" ? "Image unavailable" : "Loading..."}
    </div>
  );
}

export default function ScienceImageQuestion({ question, onAnswer, s }) {
  const [selected, setSelected] = useState(null);

  function choose(opt) {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === question.correct.name;
    setTimeout(() => onAnswer(correct), 1400);
  }

  function optionClass(opt) {
    if (selected === null) return "option-btn option-btn--default";
    if (opt === question.correct.name) return "option-btn option-btn--correct";
    if (opt === selected) return "option-btn option-btn--wrong";
    return "option-btn option-btn--faded";
  }

  const feedback = selected !== null
    ? (selected === question.correct.name
        ? (s?.historyCorrect ?? "Correct!")
        : (s?.historyWrongAnswer?.(question.correct.name) ?? `The answer was ${question.correct.name}`))
    : null;

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>

      <WikiImage
        wikiTitle={question.wikiTitle}
        alt={selected !== null ? question.correct.name : "Mystery subject"}
      />

      <div className="options-grid" role="group" aria-label="Answer options">
        {question.choices.map((opt) => (
          <button
            key={opt}
            className={optionClass(opt)}
            onClick={() => choose(opt)}
            aria-disabled={selected !== null}
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`type-feedback ${selected === question.correct.name ? "type-feedback--correct" : "type-feedback--wrong"}`}
          aria-live="assertive"
        >
          {feedback}
        </div>
      )}
    </div>
  );
}
