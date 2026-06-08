import ModeCard from "./ModeCard";
import { strings } from "../i18n/strings.jsx";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const MODES = [
  { id: "animals-photo",   icon: "🦁", title: { en: "Animal ID",       es: "Identificar Animales", fr: "Identification Animale" }, desc: { en: "Identify animals from a photo.",              es: "Identifica animales por su foto.",                        fr: "Identifiez des animaux sur photo." } },
  { id: "animals-compare", icon: "⚖️", title: { en: "Animal Compare",  es: "Comparar Animales",    fr: "Comparer Animaux" },       desc: { en: "Which is heavier, faster, or longer-lived?",  es: "¿Cuál es más pesado, rápido o longevo?",                 fr: "Lequel est le plus lourd, rapide ou longévif ?" } },
  { id: "elements",        icon: "⚗️", title: { en: "Elements",        es: "Elementos",            fr: "Éléments" },               desc: { en: "Test your knowledge of the periodic table.",  es: "Pon a prueba tu conocimiento de la tabla periódica.",    fr: "Testez vos connaissances du tableau périodique." } },
  { id: "body",            icon: "🫀", title: { en: "Human Body",      es: "Cuerpo Humano",        fr: "Corps Humain" },           desc: { en: "Click the correct organ or bone on a diagram.", es: "Haz clic en el órgano o hueso correcto.",              fr: "Cliquez sur l'organe ou l'os correct." } },
  { id: "space-photo",     icon: "🪐", title: { en: "Space: Identify", es: "Espacio: Identificar", fr: "Espace: Identifier" },     desc: { en: "Identify planets and moons from images.",     es: "Identifica planetas y lunas por imágenes.",              fr: "Identifiez des planètes et lunes sur images." } },
  { id: "space-compare",   icon: "🌌", title: { en: "Space: Compare",  es: "Espacio: Comparar",    fr: "Espace: Comparer" },       desc: { en: "Which planet is larger or farther away?",     es: "¿Qué planeta es más grande o más lejano?",               fr: "Quelle planète est plus grande ou plus éloignée ?" } },
  { id: "science-mixed",   icon: "🎲", title: { en: "Mixed",           es: "Mixto",                fr: "Mixte" },                  desc: { en: "Random questions from all science modes.",    es: "Preguntas aleatorias de todos los modos.",               fr: "Questions aléatoires de tous les modes." } },
];

const DIFFICULTIES = ["easy", "medium", "hard"];
const ROUND_SIZES = [5, 10, 15, 20];

const DIFF_LABELS = {
  en: { easy: "Easy", medium: "Medium", hard: "Hard" },
  es: { easy: "Fácil", medium: "Medio", hard: "Difícil" },
  fr: { easy: "Facile", medium: "Moyen", hard: "Difficile" },
};

const LABELS = {
  en: { difficulty: "Difficulty", questionsPerRound: "Questions per round", backBtn: "← Subjects" },
  es: { difficulty: "Dificultad", questionsPerRound: "Preguntas por ronda", backBtn: "← Temas" },
  fr: { difficulty: "Difficulté", questionsPerRound: "Questions par manche", backBtn: "← Sujets" },
};

export default function ScienceLandingScreen({ settings, onSettingsChange, onStart, onBack }) {
  const { difficulty, roundSize, lang = "en" } = settings;
  const s = strings[lang] ?? strings.en;
  const labels = LABELS[lang] ?? LABELS.en;
  const diffLabels = DIFF_LABELS[lang] ?? DIFF_LABELS.en;

  function set(patch) {
    onSettingsChange({ ...settings, ...patch });
  }

  return (
    <main className="landing">
      <header className="landing__header">
        <button className="back-btn" onClick={onBack} style={{ marginBottom: "1rem" }}>
          {labels.backBtn}
        </button>
        <h1 className="landing__title">🔬 {lang === "es" ? "Ciencia y Naturaleza" : lang === "fr" ? "Sciences et Nature" : "Science & Nature"}</h1>
      </header>

      <section aria-label="Science mode selection" className="landing__modes">
        {MODES.map((m) => (
          <ModeCard
            key={m.id}
            icon={m.icon}
            title={m.title[lang] ?? m.title.en}
            description={m.desc[lang] ?? m.desc.en}
            onClick={() => onStart(m.id)}
          />
        ))}
      </section>

      <section className="landing__options" aria-label="Game options">
        <div className="option-group">
          <label className="option-label">{s.language}</label>
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
          <label className="option-label">{labels.difficulty}</label>
          <div className="option-pills" role="group">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => set({ difficulty: d })}
                className={`pill ${difficulty === d ? "pill--active" : ""}`}
                aria-pressed={difficulty === d}
              >
                {diffLabels[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label className="option-label">{labels.questionsPerRound}</label>
          <div className="option-pills" role="group">
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
      </section>
    </main>
  );
}
