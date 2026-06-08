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

const UNITS = {
  weight_kg: "kg",
  speed_kph: "km/h",
  lifespan_years: "years",
  diameter_km: "km",
  distanceFromSun_AU: "AU",
};

function useWikiImage(wikiTitle) {
  const [imgSrc, setImgSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!wikiTitle) { setFailed(true); return; }
    let cancelled = false;
    setImgSrc(null);
    setFailed(false);
    fetchWikiImage(wikiTitle)
      .then((url) => {
        if (cancelled) return;
        if (url) setImgSrc(url);
        else setFailed(true);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [wikiTitle]);

  return { imgSrc, failed };
}

function ItemCard({ item, metric, revealed, isCorrect, onClick, disabled }) {
  const { imgSrc, failed } = useWikiImage(item.wikiTitle);
  const unit = UNITS[metric] ?? "";

  const cardClass = [
    "compare-card",
    revealed ? (isCorrect ? "compare-card--correct" : "compare-card--wrong") : "",
  ].filter(Boolean).join(" ");

  return (
    <button className={cardClass} onClick={onClick} disabled={disabled} aria-label={item.name}>
      {imgSrc && !failed ? (
        <img
          src={imgSrc}
          alt={item.name}
          referrerPolicy="no-referrer"
          className="compare-sci-img"
        />
      ) : (
        <div className="science-img-placeholder" style={{ minHeight: 120 }}>
          {failed ? "Image unavailable" : "Loading..."}
        </div>
      )}
      <div className="compare-name">{item.name}</div>
      {revealed ? (
        <div className="compare-value">
          {item.value.toLocaleString()} {unit}
        </div>
      ) : (
        <div className="compare-unknown">?</div>
      )}
    </button>
  );
}

export default function ScienceCompareQuestion({ question, onAnswer, s: _s }) {
  const [chosen, setChosen] = useState(null);

  const itemA = question.animalA ?? question.objectA;
  const itemB = question.animalB ?? question.objectB;

  function choose(side) {
    if (chosen) return;
    setChosen(side);
    setTimeout(() => onAnswer(side === question.correct), 1400);
  }

  const revealed = !!chosen;

  return (
    <div className="question-card compare-card-wrap">
      <p className="question-prompt">{question.prompt}</p>
      <div className="compare-grid">
        <ItemCard
          item={itemA}
          metric={question.metric}
          revealed={revealed}
          isCorrect={question.correct === "A"}
          onClick={() => choose("A")}
          disabled={revealed}
        />
        <div className="compare-vs">VS</div>
        <ItemCard
          item={itemB}
          metric={question.metric}
          revealed={revealed}
          isCorrect={question.correct === "B"}
          onClick={() => choose("B")}
          disabled={revealed}
        />
      </div>
    </div>
  );
}
