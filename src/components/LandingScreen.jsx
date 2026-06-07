import ModeCard from "./ModeCard";
import { regions } from "../data/countries";
import { strings } from "../i18n/strings.jsx";

const MODE_IDS = ["flags", "capitals", "locate", "shapes", "languages", "population", "area", "mixed"];

const MIXED_TOGGLE_IDS = ["flags", "capitals", "locate", "shapes", "languages", "population", "area"];

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const ROUND_SIZES = [5, 10, 15, 20];
const TIMER_OPTIONS = [
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "∞", value: null },
];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export default function LandingScreen({ settings, onSettingsChange, onStart }) {
  const { region, difficulty, roundSize, mixedModes, timerSeconds, lang } = settings;
  const s = strings[lang] ?? strings.en;

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
        <h1 className="landing__title">{s.appTitle}</h1>
        <p className="landing__subtitle">{s.appSubtitle}</p>
      </header>

      <section aria-label="Game mode selection" className="landing__modes">
        {MODE_IDS.map((id) => {
          const m = s.modes[id];
          return (
            <ModeCard
              key={id}
              icon={{ flags:"🚩", capitals:"🏛️", locate:"🗺️", shapes:"🔷", languages:"🗣️", population:"👥", area:"📐", mixed:"🎲" }[id]}
              title={m.title}
              description={m.desc}
              onClick={() => onStart(id)}
            />
          );
        })}
      </section>

      <section className="landing__options" aria-label="Game options">
        <div className="option-group">
          <label htmlFor="lang-select" className="option-label">{s.language}</label>
          <div className="option-pills" role="group" aria-label={s.language}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => set({ lang: l.code })}
                className={`pill ${lang === l.code ? "pill--active" : ""}`}
                aria-pressed={lang === l.code}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label htmlFor="region-select" className="option-label">{s.region}</label>
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
          <label className="option-label">{s.difficulty}</label>
          <div className="option-pills" role="group" aria-label={s.difficulty}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => set({ difficulty: d })}
                className={`pill ${difficulty === d ? "pill--active" : ""}`}
                aria-pressed={difficulty === d}
              >
                {s.difficulties[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label className="option-label">{s.questionsPerRound}</label>
          <div className="option-pills" role="group" aria-label={s.questionsPerRound}>
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
          <label className="option-label">{s.timerPerQuestion}</label>
          <p className="option-hint">{s.timerDisabledHint}</p>
          <div className="option-pills" role="group" aria-label={s.timerPerQuestion}>
            {TIMER_OPTIONS.map((t) => (
              <button
                key={String(t.value)}
                onClick={() => set({ timerSeconds: t.value })}
                className={`pill ${timerSeconds === t.value ? "pill--active" : ""}`}
                aria-pressed={timerSeconds === t.value}
              >
                {t.value === null ? s.timerInfinite : t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group option-group--full">
          <label className="option-label">{s.mixedIncludes}</label>
          <div className="option-pills" role="group" aria-label={s.mixedIncludes}>
            {MIXED_TOGGLE_IDS.map((id) => (
              <button
                key={id}
                onClick={() => toggleMixedMode(id)}
                className={`pill ${mixedModes.includes(id) ? "pill--active" : ""}`}
                aria-pressed={mixedModes.includes(id)}
              >
                {{"flags":"🚩","capitals":"🏛️","locate":"🗺️","shapes":"🔷","languages":"🗣️","population":"👥","area":"📐"}[id]} {s.modes[id].title}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
