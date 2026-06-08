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

export default function BodyQuestion({ question, onAnswer, s }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgStatus, setImgStatus] = useState("loading");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!question.wikiTitle) { setImgStatus("failed"); return; }
    let cancelled = false;
    setImgSrc(null);
    setImgStatus("loading");
    fetchWikiImage(question.wikiTitle)
      .then((url) => {
        if (cancelled) return;
        if (url) { setImgSrc(url); setImgStatus("loaded"); }
        else setImgStatus("failed");
      })
      .catch(() => { if (!cancelled) setImgStatus("failed"); });
    return () => { cancelled = true; };
  }, [question.wikiTitle]);

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

      {imgStatus === "loaded" ? (
        <img
          src={imgSrc}
          alt={selected !== null ? question.correct.name : "Mystery body part"}
          referrerPolicy="no-referrer"
          className="science-img"
          onError={() => setImgStatus("failed")}
        />
      ) : (
        <div className="science-img-placeholder">
          {imgStatus === "failed" ? "Image unavailable" : "Loading..."}
        </div>
      )}

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
        <>
          <div
            className={`type-feedback ${selected === question.correct.name ? "type-feedback--correct" : "type-feedback--wrong"}`}
            aria-live="assertive"
          >
            {feedback}
          </div>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
            {question.correct.fact}
          </p>
        </>
      )}
    </div>
  );
}
