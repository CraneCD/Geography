import ModeCard from "./ModeCard";

const MODES = [
  { id: "people",        icon: "🧑‍🎨", title: { en: "Famous People",    es: "Personajes Famosos", fr: "Personnages Célèbres" }, desc: { en: "Identify historical figures from their portrait.", es: "Identifica personajes históricos por su retrato.", fr: "Identifiez des personnages historiques à partir de leur portrait." } },
  { id: "who-first",     icon: "⏳", title: { en: "Who Came First?",  es: "¿Quién fue primero?",  fr: "Qui est venu en premier ?" }, desc: { en: "Pick which person or event came earlier in history.", es: "Elige qué persona o evento ocurrió primero en la historia.", fr: "Choisissez qui ou quoi est arrivé en premier dans l'histoire." } },
  { id: "events",        icon: "📅", title: { en: "Historical Events", es: "Eventos Históricos",  fr: "Événements Historiques" }, desc: { en: "Match events to the year they happened.", es: "Relaciona eventos con el año en que ocurrieron.", fr: "Associez les événements à l'année où ils ont eu lieu." } },
  { id: "inventions",    icon: "💡", title: { en: "Inventions",         es: "Inventos",             fr: "Inventions" }, desc: { en: "Name the inventor or era of famous inventions.", es: "Nombra al inventor o la época de inventos famosos.", fr: "Nommez l'inventeur ou l'époque des inventions célèbres." } },
  { id: "art",           icon: "🎨", title: { en: "Art",                es: "Arte",                 fr: "Art" }, desc: { en: "Identify the artist or movement behind famous paintings.", es: "Identifica al artista o movimiento detrás de pinturas famosas.", fr: "Identifiez l'artiste ou le mouvement derrière des peintures célèbres." } },
  { id: "history-mixed", icon: "🎲", title: { en: "Mixed",              es: "Mixto",                fr: "Mixte" }, desc: { en: "Random questions from all history modes.", es: "Preguntas aleatorias de todos los modos de historia.", fr: "Questions aléatoires de tous les modes d'histoire." } },
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

export default function HistoryLandingScreen({ settings, onSettingsChange, onStart, onBack }) {
  const { difficulty, roundSize, lang = "en" } = settings;
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
        <h1 className="landing__title">📜 {lang === "es" ? "Historia y Cultura" : lang === "fr" ? "Histoire et Culture" : "History & Culture"}</h1>
      </header>

      <section aria-label="History mode selection" className="landing__modes">
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
