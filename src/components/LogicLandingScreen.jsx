import ModeCard from "./ModeCard";
import { strings } from "../i18n/strings.jsx";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const MODES = [
  { id: "arithmetic",  icon: "➕", title: { en: "Arithmetic",       es: "Aritmética",        fr: "Arithmétique" },    desc: { en: "Mental math drills — add, subtract, multiply, divide.",                        es: "Cálculo mental — suma, resta, multiplicación, división.",                fr: "Calcul mental — addition, soustraction, multiplication, division." } },
  { id: "fractions",   icon: "½",  title: { en: "Fractions & %",    es: "Fracciones y %",   fr: "Fractions et %" },  desc: { en: "Percentages, simplify fractions, compare values.",                             es: "Porcentajes, simplifica fracciones, compara valores.",                   fr: "Pourcentages, simplifier fractions, comparer valeurs." } },
  { id: "sequences",   icon: "🔢", title: { en: "Number Sequences", es: "Secuencias",        fr: "Suites" },          desc: { en: "Spot the pattern and find the next term.",                                    es: "Encuentra el patrón y el siguiente término.",                            fr: "Trouvez le schéma et le terme suivant." } },
  { id: "angle",       icon: "📐", title: { en: "Guess the Angle",  es: "Adivina el ángulo", fr: "Devinez l'angle" }, desc: { en: "Estimate the measure of a drawn angle in degrees.",                            es: "Estima el ángulo en grados.",                                            fr: "Estimez la mesure d'un angle en degrés." } },
  { id: "algebra",     icon: "🔣", title: { en: "Solve for x",      es: "Despeja x",         fr: "Résoudre x" },      desc: { en: "Solve one- and two-step equations.",                                          es: "Resuelve ecuaciones de uno y dos pasos.",                                fr: "Résolvez des équations simples." } },
  { id: "logic-mixed", icon: "🎲", title: { en: "Mixed",            es: "Mixto",             fr: "Mixte" },           desc: { en: "Random questions from all logic modes.",                                      es: "Preguntas aleatorias de todos los modos.",                               fr: "Questions aléatoires de tous les modes." } },
];

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const ROUND_SIZES = [5, 10, 15, 20];

const DIFF_LABELS = {
  en: { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert" },
  es: { easy: "Fácil", medium: "Medio", hard: "Difícil", expert: "Experto" },
  fr: { easy: "Facile", medium: "Moyen", hard: "Difficile", expert: "Expert" },
};

const LABELS = {
  en: { difficulty: "Difficulty", questionsPerRound: "Questions per round", backBtn: "← Subjects" },
  es: { difficulty: "Dificultad", questionsPerRound: "Preguntas por ronda", backBtn: "← Temas" },
  fr: { difficulty: "Difficulté", questionsPerRound: "Questions par manche", backBtn: "← Sujets" },
};

export default function LogicLandingScreen({ settings, onSettingsChange, onStart, onBack }) {
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
        <h1 className="landing__title">🔢 {lang === "es" ? "Lógica y Números" : lang === "fr" ? "Logique et Nombres" : "Logic & Numbers"}</h1>
      </header>

      <section aria-label="Logic mode selection" className="landing__modes">
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
