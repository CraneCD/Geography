import ModeCard from "./ModeCard";
import { regions } from "../data/countries";

const SINGLE_MODES = [
  { id: "flags", icon: "🚩", title: "Flags", description: "See a flag — name the country." },
  { id: "capitals", icon: "🏛️", title: "Capitals", description: "Name the capital city of a country." },
  { id: "locate", icon: "🗺️", title: "Locate", description: "Click the correct country on the map." },
  { id: "shapes", icon: "🔷", title: "Shapes", description: "Identify a country from its outline." },
  { id: "languages", icon: "🗣️", title: "Languages", description: "Which country speaks this language?" },
  { id: "population", icon: "👥", title: "Population", description: "Pick the country with the larger population." },
  { id: "area", icon: "📐", title: "Area", description: "Pick the country with the larger land area." },
];

const MIXED_TOGGLES = [
  { id: "flags", icon: "🚩", label: "Flags" },
  { id: "capitals", icon: "🏛️", label: "Capitals" },
  { id: "locate", icon: "🗺️", label: "Locate" },
  { id: "shapes", icon: "🔷", label: "Shapes" },
  { id: "languages", icon: "🗣️", label: "Languages" },
  { id: "population", icon: "👥", label: "Population" },
  { id: "area", icon: "📐", label: "Area" },
];

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const ROUND_SIZES = [5, 10, 15, 20];
const TIMER_OPTIONS = [
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "∞", value: null },
];

export default function LandingScreen({ settings, onSettingsChange, onStart }) {
  const { region, difficulty, roundSize, mixedModes, timerSeconds } = settings;

  function set(patch) {
    onSettingsChange({ ...settings, ...patch });
  }

  function toggleMixedMode(id) {
    const next = mixedModes.includes(id)
      ? mixedModes.length > 2 ? mixedModes.filter((m) => m !== id) : mixedModes
      : [...mixedModes, id];
    set({ mixedModes: next });
  }

  return (
    <main className="landing">
      <header className="landing__header">
        <h1 className="landing__title">🌍 World Geography Quiz</h1>
        <p className="landing__subtitle">Test your knowledge of flags, capitals, and country locations.</p>
      </header>

      <section aria-label="Game mode selection" className="landing__modes">
        {SINGLE_MODES.map((m) => (
          <ModeCard
            key={m.id}
            icon={m.icon}
            title={m.title}
            description={m.description}
            onClick={() => onStart(m.id)}
          />
        ))}
        <ModeCard
          icon="🎲"
          title="Mixed"
          description="Random questions from your chosen modes."
          onClick={() => onStart("mixed")}
        />
      </section>

      <section className="landing__options" aria-label="Game options">
        <div className="option-group">
          <label htmlFor="region-select" className="option-label">Region</label>
          <select
            id="region-select"
            value={region}
            onChange={(e) => set({ region: e.target.value })}
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
                onClick={() => set({ difficulty: d })}
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
                onClick={() => set({ roundSize: n })}
                className={`pill ${roundSize === n ? "pill--active" : ""}`}
                aria-pressed={roundSize === n}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label className="option-label">Timer per question</label>
          <p className="option-hint">Disabled on Easy &amp; Expert difficulty</p>
          <div className="option-pills" role="group" aria-label="Timer per question">
            {TIMER_OPTIONS.map((t) => (
              <button
                key={String(t.value)}
                onClick={() => set({ timerSeconds: t.value })}
                className={`pill ${timerSeconds === t.value ? "pill--active" : ""}`}
                aria-pressed={timerSeconds === t.value}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group option-group--full">
          <label className="option-label">Mixed mode includes</label>
          <div className="option-pills" role="group" aria-label="Mixed mode includes">
            {MIXED_TOGGLES.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleMixedMode(t.id)}
                className={`pill ${mixedModes.includes(t.id) ? "pill--active" : ""}`}
                aria-pressed={mixedModes.includes(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
