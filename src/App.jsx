import { useEffect, useState } from "react";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { useSettings } from "./hooks/useSettings.js";
import { getStrings } from "./i18n/index.js";
import { findSubject } from "./subjects/catalog.js";
import SubjectScreen from "./components/SubjectScreen.jsx";
import SubjectLanding from "./components/SubjectLanding.jsx";
import QuizScreen from "./components/quiz/QuizScreen.jsx";

/** Loads a subject's code-split module (generators, data, custom views) once. */
function useSubjectModule(subject) {
  const [loaded, setLoaded] = useState({});
  useEffect(() => {
    if (!subject || loaded[subject.id]) return undefined;
    let cancelled = false;
    subject.load().then((mod) => {
      if (!cancelled) setLoaded((prev) => ({ ...prev, [subject.id]: mod }));
    });
    return () => { cancelled = true; };
  }, [subject, loaded]);
  return subject ? loaded[subject.id] ?? null : null;
}

function NotFound({ t, onHome }) {
  return (
    <main className="page page--narrow">
      <p className="notice" role="alert">{t.notFound}</p>
      <button type="button" className="btn btn--primary" onClick={onHome}>{t.goHome}</button>
    </main>
  );
}

export default function App() {
  const [route, navigate] = useHashRoute();
  const [settings, update] = useSettings();
  const t = getStrings(settings.lang);
  const subject = route.subject ? findSubject(route.subject) : null;
  const module = useSubjectModule(subject);

  useEffect(() => {
    document.documentElement.lang = settings.lang;
    document.title = subject
      ? `${t.subjects[subject.id].title}${route.mode && t.modes[subject.id][route.mode] ? ` · ${t.modes[subject.id][route.mode].title}` : ""} — ${t.appTitle}`
      : t.docTitle;
  }, [settings.lang, subject, route.mode, t]);

  let screen;
  if (!route.subject) {
    screen = <SubjectScreen settings={settings} update={update} t={t} onSelect={(id) => navigate(id)} />;
  } else if (!subject || route.extra || (route.mode && !subject.modes.includes(route.mode))) {
    screen = <NotFound t={t} onHome={() => navigate()} />;
  } else if (!route.mode) {
    screen = (
      <SubjectLanding
        subject={subject}
        settings={settings}
        update={update}
        t={t}
        onStart={(mode) => navigate(subject.id, mode)}
        onBack={() => navigate()}
      />
    );
  } else if (!module) {
    screen = <main className="page page--narrow"><p className="notice" role="status">{t.loading}</p></main>;
  } else {
    screen = (
      <QuizScreen
        // A new round whenever the route or any setting changes.
        key={`${subject.id}/${route.mode}/${JSON.stringify(settings)}`}
        subjectId={subject.id}
        mode={route.mode}
        settings={settings}
        module={module}
        t={t}
        onExit={() => navigate(subject.id)}
      />
    );
  }

  // Each subject gets its own highlighter colour (see --hl in index.css).
  return <div className="app" data-subject={subject?.id ?? "home"}>{screen}</div>;
}
