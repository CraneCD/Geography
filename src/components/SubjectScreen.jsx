import { strings } from "../i18n/strings.jsx";

const SUBJECTS = [
  {
    id: "geography",
    icon: "🌍",
    title: { en: "Geography", es: "Geografía", fr: "Géographie" },
    desc: { en: "Flags, capitals, maps, shapes, and more.", es: "Banderas, capitales, mapas, siluetas y más.", fr: "Drapeaux, capitales, cartes, silhouettes et plus." },
  },
  {
    id: "history",
    icon: "📜",
    title: { en: "History & Culture", es: "Historia y Cultura", fr: "Histoire et Culture" },
    desc: { en: "Famous people, events, inventions, and art.", es: "Personajes famosos, eventos, inventos y arte.", fr: "Personnages célèbres, événements, inventions et art." },
  },
  {
    id: "logic",
    icon: "🧮",
    title: { en: "Logic & Numbers", es: "Lógica y Números", fr: "Logique et Nombres" },
    desc: { en: "Arithmetic, fractions, sequences, angles, and algebra.", es: "Aritmética, fracciones, secuencias, ángulos y álgebra.", fr: "Arithmétique, fractions, suites, angles et algèbre." },
  },
];

export default function SubjectScreen({ lang = "en", onSelect }) {
  return (
    <main className="landing">
      <header className="landing__header">
        <h1 className="landing__title">
          {{ en: "🧠 Quiz", es: "🧠 Quiz", fr: "🧠 Quiz" }[lang] ?? "🧠 Quiz"}
        </h1>
        <p className="landing__subtitle">
          {{ en: "Choose a subject to get started.", es: "Elige un tema para comenzar.", fr: "Choisissez un sujet pour commencer." }[lang]}
        </p>
      </header>

      <section className="subject-grid" aria-label="Subject selection">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            className="subject-card"
            onClick={() => onSelect(s.id)}
          >
            <span className="subject-card__icon">{s.icon}</span>
            <span className="subject-card__title">{s.title[lang] ?? s.title.en}</span>
            <span className="subject-card__desc">{s.desc[lang] ?? s.desc.en}</span>
          </button>
        ))}
      </section>
    </main>
  );
}
