import FlagImage from "./FlagImage";
import { strings } from "../i18n/strings.jsx";

export default function SummaryScreen({ results, total, onPlayAgain, onChangeMode, s: sProp }) {
  const s = sProp ?? strings.en;
  const correct = results.filter((r) => r.wasCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const missed = results.filter((r) => !r.wasCorrect);

  return (
    <main className="summary" aria-label="Round summary">
      <h1 className="summary__title">Round Complete!</h1>

      <div
        className="summary__score-ring"
        aria-label={`You scored ${correct} out of ${total}, ${accuracy}% accuracy`}
      >
        <div className="score-ring__number">{correct}/{total}</div>
        <div className="score-ring__label">{accuracy}% accuracy</div>
      </div>

      <div className="summary__medal" aria-hidden="true">
        {accuracy >= 90 ? "🏆" : accuracy >= 70 ? "🥈" : accuracy >= 50 ? "🥉" : "📚"}
      </div>

      {missed.length > 0 && (
        <section className="summary__missed" aria-label="Missed questions">
          <h2 className="summary__missed-title">Missed ({missed.length})</h2>
          <ul className="missed-list">
            {missed.map((r, i) => (
              <li key={i} className="missed-item">
                {r.country.code && r.type !== "locate" && (
                  <FlagImage
                    code={r.country.code}
                    countryName={r.country.name}
                    className="missed-flag"
                  />
                )}
                <div>
                  <div className="missed-country">{r.country.name}</div>
                  {r.country.capital && (
                    <div className="missed-detail">Capital: {r.country.capital} · Region: {r.country.region}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="summary__actions">
        <button onClick={onPlayAgain} className="btn btn--primary">{s.playAgain}</button>
        <button onClick={onChangeMode} className="btn btn--secondary">{s.changeMode}</button>
      </div>
    </main>
  );
}
