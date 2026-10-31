import { SUBJECTS } from "../subjects/catalog.js";
import { LanguagePicker } from "./SubjectLanding.jsx";

export default function SubjectScreen({ settings, update, t, onSelect }) {
  return (
    <main className="landing">
      <header className="landing__header">
        <h1 className="landing__title">{t.appTitle}</h1>
        <p className="landing__subtitle">{t.appSubtitle}</p>
      </header>

      <nav className="subject-grid" aria-label={t.appSubtitle}>
        {SUBJECTS.map((s) => (
          <a key={s.id} className="subject-card" href={`#/${s.id}`} onClick={(e) => { e.preventDefault(); onSelect(s.id); }}>
            <span className="subject-card__icon" aria-hidden="true">{s.icon}</span>
            <span className="subject-card__title">{t.subjects[s.id].title}</span>
            <span className="subject-card__desc">{t.subjects[s.id].desc}</span>
          </a>
        ))}
      </nav>

      <section className="landing__options landing__options--compact">
        <LanguagePicker settings={settings} update={update} t={t} />
      </section>
    </main>
  );
}
