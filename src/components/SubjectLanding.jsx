import { useId } from "react";
import { modeIcon } from "../subjects/catalog.js";
import { getBest } from "../lib/storage.js";
import { LANGUAGES } from "../i18n/index.js";
import { DIFFICULTIES, ROUND_SIZES, TIMER_OPTIONS, REGIONS } from "../hooks/useSettings.js";
import { MIXABLE_MODES } from "../subjects/catalog.js";

/** A labelled group of toggle pills (fieldset/legend for correct grouping semantics). */
export function PillGroup({ legend, hint, options, isActive, onSelect, full }) {
  return (
    <fieldset className={`option-group${full ? " option-group--full" : ""}`}>
      <legend className="option-label">{legend}</legend>
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
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function LanguagePicker({ settings, update, t }) {
  return (
    <PillGroup
      legend={t.language}
      options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
      isActive={(v) => settings.lang === v}
      onSelect={(lang) => update({ lang })}
    />
  );
}

function ModeCard({ icon, title, description, best, onClick, t }) {
  return (
    <button type="button" onClick={onClick} className="mode-card" aria-label={`${t.playMode(title)}. ${description}${best ? `. ${t.bestScore(best.pct)}` : ""}`}>
      <span className="mode-card__icon" aria-hidden="true">{icon}</span>
      <span className="mode-card__title">{title}</span>
      <span className="mode-card__desc">{description}</span>
      {best && <span className="mode-card__best">{t.bestScore(best.pct)}</span>}
    </button>
  );
}

export default function SubjectLanding({ subject, settings, update, t, onStart, onBack }) {
  const regionId = useId();
  const modes = t.modes[subject.id];
  const showRegion = subject.options.includes("region");
  const showMixed = subject.options.includes("mixedModes");

  function toggleMixed(id) {
    const cur = settings.mixedModes;
    const next = cur.includes(id) ? (cur.length > 2 ? cur.filter((m) => m !== id) : cur) : [...cur, id];
    update({ mixedModes: next });
  }

  const titleKey = { geography: "geo", history: "hist", logic: "logic", science: "sci" }[subject.id];

  return (
    <main className="landing">
      <header className="landing__header">
        <button type="button" className="back-btn landing__back" onClick={onBack}>{t.backToSubjects}</button>
        <h1 className="landing__title">{t[titleKey].title}</h1>
        <p className="landing__subtitle">{t[titleKey].subtitle}</p>
        {subject.englishContent && t.englishContentNote && <p className="notice">{t.englishContentNote}</p>}
      </header>

      <section aria-label={t.subjects[subject.id].title} className="landing__modes">
        {subject.modes.map((id) => (
          <ModeCard
            key={id}
            icon={modeIcon(id)}
            title={modes[id].title}
            description={modes[id].desc}
            best={getBest(subject.id, id, settings.difficulty)}
            onClick={() => onStart(id)}
            t={t}
          />
        ))}
      </section>

      <section className="landing__options" aria-label={t.difficulty}>
        <LanguagePicker settings={settings} update={update} t={t} />

        {showRegion && (
          <div className="option-group">
            <label htmlFor={regionId} className="option-label">{t.region}</label>
            <select id={regionId} value={settings.region} onChange={(e) => update({ region: e.target.value })} className="option-select">
              {REGIONS.map((r) => <option key={r} value={r}>{t.regions[r]}</option>)}
            </select>
          </div>
        )}

        <PillGroup
          legend={t.difficulty}
          hint={t.difficultyHint}
          options={DIFFICULTIES.map((d) => ({ value: d, label: t.difficulties[d] }))}
          isActive={(v) => settings.difficulty === v}
          onSelect={(difficulty) => update({ difficulty })}
        />

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

        {showMixed && (
          <PillGroup
            full
            legend={t.mixedIncludes}
            options={MIXABLE_MODES.map((id) => ({ value: id, label: `${modeIcon(id)} ${modes[id].title}` }))}
            isActive={(v) => settings.mixedModes.includes(v)}
            onSelect={toggleMixed}
          />
        )}
      </section>
    </main>
  );
}
