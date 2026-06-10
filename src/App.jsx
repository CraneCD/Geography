import { useState, lazy, Suspense } from "react";
import SubjectScreen from "./components/SubjectScreen";
import "./App.css";

// Each subject's screens are code-split so the initial bundle only contains
// the subject picker — heavy dependencies (world-atlas topology, history
// datasets) load on demand when a subject is chosen.
const LandingScreen = lazy(() => import("./components/LandingScreen"));
const GameScreen = lazy(() => import("./components/GameScreen"));
const HistoryLandingScreen = lazy(() => import("./components/HistoryLandingScreen"));
const HistoryGameScreen = lazy(() => import("./components/HistoryGameScreen"));
const LogicLandingScreen = lazy(() => import("./components/LogicLandingScreen"));
const LogicGameScreen = lazy(() => import("./components/LogicGameScreen"));
const ScienceLandingScreen = lazy(() => import("./components/ScienceLandingScreen"));
const ScienceGameScreen = lazy(() => import("./components/ScienceGameScreen"));

const ALL_MIXED_MODES = ["flags", "capitals", "locate", "shapes", "languages", "population", "area"];

const DEFAULT_SETTINGS = {
  region: "All",
  difficulty: "medium",
  roundSize: 10,
  mixedModes: ALL_MIXED_MODES,
  timerSeconds: 60,
  lang: "en",
};

// screen: "subject" | "geo-landing" | "geo-game" | "history-landing" | "history-game" | "logic-landing" | "logic-game" | "science-landing" | "science-game"
function App() {
  const [screen, setScreen] = useState("subject");
  const [config, setConfig] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  function handleSubjectSelect(subject) {
    if (subject === "geography") setScreen("geo-landing");
    else if (subject === "history") setScreen("history-landing");
    else if (subject === "logic") setScreen("logic-landing");
    else setScreen("science-landing");
  }

  function handleGeoStart(mode) {
    setConfig({ mode, region: settings.region, difficulty: settings.difficulty, count: settings.roundSize, mixedModes: settings.mixedModes, timerSeconds: settings.timerSeconds, lang: settings.lang });
    setScreen("geo-game");
  }

  function handleHistoryStart(mode) {
    setConfig({ mode, difficulty: settings.difficulty, count: settings.roundSize, timerSeconds: settings.timerSeconds, lang: settings.lang });
    setScreen("history-game");
  }

  function handleLogicStart(mode) {
    setConfig({ mode, difficulty: settings.difficulty, count: settings.roundSize, lang: settings.lang });
    setScreen("logic-game");
  }

  function handleScienceStart(mode) {
    setConfig({ mode, difficulty: settings.difficulty, count: settings.roundSize, lang: settings.lang });
    setScreen("science-game");
  }

  return (
    <div className="app">
      {screen === "subject" && (
        <SubjectScreen lang={settings.lang} onSelect={handleSubjectSelect} />
      )}
      <Suspense fallback={null}>
      {screen === "geo-landing" && (
        <LandingScreen
          settings={settings}
          onSettingsChange={setSettings}
          onStart={handleGeoStart}
          onBack={() => setScreen("subject")}
        />
      )}
      {screen === "geo-game" && (
        <GameScreen config={config} onChangeMode={() => setScreen("geo-landing")} />
      )}
      {screen === "history-landing" && (
        <HistoryLandingScreen
          settings={settings}
          onSettingsChange={setSettings}
          onStart={handleHistoryStart}
          onBack={() => setScreen("subject")}
        />
      )}
      {screen === "history-game" && (
        <HistoryGameScreen config={config} onChangeMode={() => setScreen("history-landing")} />
      )}
      {screen === "logic-landing" && (
        <LogicLandingScreen
          settings={settings}
          onSettingsChange={setSettings}
          onStart={handleLogicStart}
          onBack={() => setScreen("subject")}
        />
      )}
      {screen === "logic-game" && (
        <LogicGameScreen config={config} onChangeMode={() => setScreen("logic-landing")} />
      )}
      {screen === "science-landing" && (
        <ScienceLandingScreen
          settings={settings}
          onSettingsChange={setSettings}
          onStart={handleScienceStart}
          onBack={() => setScreen("subject")}
        />
      )}
      {screen === "science-game" && (
        <ScienceGameScreen config={config} onChangeMode={() => setScreen("science-landing")} />
      )}
      </Suspense>
    </div>
  );
}

export default App;
