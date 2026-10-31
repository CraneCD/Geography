import { useId } from "react";
import { SUBJECTS } from "../subjects/catalog.js";
import { LANGUAGES } from "../i18n/index.js";
import { getActivity, getSubjectBest } from "../lib/storage.js";
import Icon from "./Icon.jsx";

export function LanguageSelect({ settings, update, t }) {
  const id = useId();
  return (
    <div className="lang-select">
      <label htmlFor={id} className="sr-only">{t.language}</label>
      <select id={id} value={settings.lang} onChange={(e) => update({ lang: e.target.value })}>
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.code.toUpperCase()} · {l.label}</option>)}
      </select>
    </div>
  );
}

export default function SubjectScreen({ settings, update, t, onSelect }) {
  const { streak, answered } = getActivity();
  const [before, highlight, after] = t.homeTitle;

  return (
    <main className="page">
      <div className="topbar">
        <span className="kicker">{t.homeKicker}</span>
        <LanguageSelect settings={settings} update={update} t={t} />
      </div>

      <header className="page__header">
        <h1 className="page__title">{before}<mark className="hl">{highlight}</mark>{after}</h1>
        <p className="page__subtitle">{t.homeSubtitle}</p>
      </header>

      <nav className="contents card" aria-label={t.appTitle}>
        {SUBJECTS.map((s, i) => {
          const best = getSubjectBest(s.id, s.modes, settings.difficulty);
          return (
            <a
              key={s.id}
              className="contents__row"
              data-subject={s.id}
              href={`#/${s.id}`}
              onClick={(e) => { e.preventDefault(); onSelect(s.id); }}
            >
              <span className="contents__num">{String(i + 1).padStart(2, "0")}</span>
              <Icon name={s.id} size={28} className="contents__icon" />
              <span className="contents__text">
                <span className="contents__title">{t.subjects[s.id].title}</span>
                <span className="contents__desc">{t.subjects[s.id].desc}</span>
              </span>
              <span className={`contents__best${best == null ? " contents__best--none" : ""}`}>
                {best == null ? t.modesCount(s.modes.length) : t.bestShort(best)}
              </span>
            </a>
          );
        })}
      </nav>

      <section className="stats" aria-label={`${t.streakLabel}, ${t.answeredLabel}`}>
        <div className="stat card">
          <span className="kicker">{t.streakLabel}</span>
          <span className="stat__value">{t.streakDays(streak)}</span>
        </div>
        <div className="stat card stat--hl">
          <span className="kicker">{t.answeredLabel}</span>
          <span className="stat__value">{t.answeredCount(answered)}</span>
        </div>
      </section>
    </main>
  );
}
