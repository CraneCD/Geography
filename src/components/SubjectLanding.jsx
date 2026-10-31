import { useId } from "react";
import { ArrowLeft } from "lucide-react";
import { SUBJECTS, MIXABLE_MODES } from "../subjects/catalog.js";
import { getBest } from "../lib/storage.js";
import { LANGUAGES } from "../i18n/index.js";
import { DIFFICULTIES, ROUND_SIZES, TIMER_OPTIONS, REGIONS } from "../hooks/useSettings.js";
import Icon from "./Icon.jsx";

/** A labelled group of toggle pills (fieldset/legend for correct grouping semantics). */
export function PillGroup({ legend, hint, options, isActive, onSelect, full }) {
  return (
    <fieldset className={`option-group${full ? " option-group--full" : ""}`}>
      <legend className="kicker option-group__legend">{legend}</legend>
      {hint && <p className="option-hint">{hint}</p>}
      <div className="option-pills">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onSelect(o.value)}
            className={`pill${isActive(o.value) ? " pill--active" : ""}`}
            aria-pressed={isActive(o.value)}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ModeCard({ mode, title, description, best, onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mode-card card"
      aria-label={`${t.playMode(title)}. ${description}${best ? `. ${t.bestScore(best.pct)}` : ""}`}
    >
      <span className="mode-card__top">
        <Icon name={mode} size={26} className="mode-card__icon" />
        {best && <span className="mode-card__best">{t.bestShort(best.pct)}</span>}
      </span>
      <span className="mode-card__title">{title}</span>
      <span className="mode-card__desc">{description}</span>
    </button>
  );
}

export default function SubjectLanding({ subject, settings, update, t, onStart, onBack }) {
  const regionId = useId();
  const modes = t.modes[subject.id];
  const chapter = SUBJECTS.indexOf(subject) + 1;
  const showRegion = subject.options.includes("region");
  const showMixed = subject.options.includes("mixedModes");
  const titleKey = { geography: "geo", history: "hist", logic: "logic", science: "sci" }[subject.id];

  function toggleMixed(id) {
    const cur = settings.mixedModes;
    const next = cur.includes(id) ? (cur.length > 2 ? cur.filter((m) => m !== id) : cur) : [...cur, id];
    update({ mixedModes: next });
  }

  return (
    <main className="page">
      <div className="topbar">
        <button type="button" className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> {t.backToSubjects}
        </button>
        <span className="kicker">{t.chapter(String(chapter).padStart(2, "0"))}</span>
      </div>

      <header className="page__header">
        <h1 className="page__title page__title--with-icon">
          <Icon name={subject.id} size={40} className="page__title-icon" />
          <span><mark className="hl">{t[titleKey].title}</mark></span>
        </h1>
        <p className="page__subtitle">{t[titleKey].subtitle}</p>
        {subject.englishContent && t.englishContentNote && <p className="notice">{t.englishContentNote}</p>}
      </header>

      <section aria-label={t.subjects[subject.id].title} className="mode-grid">
        {subject.modes.map((id) => (
          <ModeCard
            key={id}
            mode={id}
            title={modes[id].title}
            description={modes[id].desc}
            best={getBest(subject.id, id, settings.difficulty)}
            onClick={() => onStart(id)}
            t={t}
          />
        ))}
      </section>

      <section className="settings card" aria-labelledby="settings-title">
        <h2 id="settings-title" className="settings__title">{t.settingsTitle}</h2>

        <PillGroup
          legend={t.difficulty}
          hint={t.difficultyHint}
          options={DIFFICULTIES.map((d) => ({ value: d, label: t.difficulties[d] }))}
          isActive={(v) => settings.difficulty === v}
          onSelect={(difficulty) => update({ difficulty })}
        />

        {showRegion && (
          <div className="option-group">
            <label htmlFor={regionId} className="kicker option-group__legend">{t.region}</label>
            <select id={regionId} value={settings.region} onChange={(e) => update({ region: e.target.value })} className="option-select">
              {REGIONS.map((r) => <option key={r} value={r}>{t.regions[r]}</option>)}
            </select>
          </div>
        )}

        <PillGroup
          legend={t.questionsPerRound}
          options={ROUND_SIZES.map((n) => ({ value: n, label: String(n) }))}
          isActive={(v) => settings.roundSize === v}
          onSelect={(roundSize) => update({ roundSize })}
        />

        <PillGroup
          legend={t.timerPerQuestion}
          options={TIMER_OPTIONS.map((s) => ({ value: s, label: s == null ? t.timerOff : t.seconds(s) }))}
          isActive={(v) => settings.timer === v}
          onSelect={(timer) => update({ timer })}
        />

        <PillGroup
          legend={t.practiceMode}
          hint={t.practiceHint}
          options={[{ value: false, label: t.off }, { value: true, label: t.on }]}
          isActive={(v) => settings.practice === v}
          onSelect={(practice) => update({ practice })}
        />

        <PillGroup
          legend={t.language}
          options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
          isActive={(v) => settings.lang === v}
          onSelect={(lang) => update({ lang })}
        />

        {showMixed && (
          <PillGroup
            full
            legend={t.mixedIncludes}
            options={MIXABLE_MODES.map((id) => ({ value: id, label: modes[id].title, icon: id }))}
            isActive={(v) => settings.mixedModes.includes(v)}
            onSelect={toggleMixed}
          />
        )}
      </section>
    </main>
  );
}
