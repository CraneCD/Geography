import { useState } from "react";
import ModeCard from "./ModeCard";
import { regions } from "../data/countries";

const MODES = [
  { id: "flags", icon: "🚩", title: "Flags", description: "See a flag — name the country." },
  { id: "capitals", icon: "🏛️", title: "Capitals", description: "Name the capital city of a country." },
  { id: "locate", icon: "🗺️", title: "Locate the Country", description: "Click the correct country on the map." },
  { id: "mixed", icon: "🎲", title: "Mixed", description: "Random questions from all three modes." },
];

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const ROUND_SIZES = [5, 10, 15, 20];

export default function LandingScreen({ onStart }) {
  const [region, setRegion] = useState("All");
  const [difficulty, setDifficulty] = useState("medium");
  const [roundSize, setRoundSize] = useState(10);

  return (
    <main className="landing">
      <header className="landing__header">
        <h1 className="landing__title">🌍 World Geography Quiz</h1>
        <p className="landing__subtitle">Test your knowledge of flags, capitals, and country locations.</p>
      </header>

      <section aria-label="Game mode selection" className="landing__modes">
        {MODES.map((m) => (
          <ModeCard
            key={m.id}
            icon={m.icon}
            title={m.title}
            description={m.description}
            onClick={() => onStart({ mode: m.id, region, difficulty, count: roundSize })}
          />
        ))}
      </section>

      <section className="landing__options" aria-label="Game options">
        <div className="option-group">
          <label htmlFor="region-select" className="option-label">Region</label>
          <select
            id="region-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="option-select"
          >
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="option-group">
          <label className="option-label">Difficulty</label>
          <div className="option-pills" role="group" aria-label="Difficulty">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`pill ${difficulty === d ? "pill--active" : ""}`}
                aria-pressed={difficulty === d}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label className="option-label">Questions per round</label>
          <div className="option-pills" role="group" aria-label="Questions per round">
            {ROUND_SIZES.map((n) => (
              <button
                key={n}
                onClick={() => setRoundSize(n)}
                className={`pill ${roundSize === n ? "pill--active" : ""}`}
                aria-pressed={roundSize === n}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
