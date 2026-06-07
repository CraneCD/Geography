import { useState } from "react";
import SubjectScreen from "./components/SubjectScreen";
import LandingScreen from "./components/LandingScreen";
import GameScreen from "./components/GameScreen";
import HistoryLandingScreen from "./components/HistoryLandingScreen";
import HistoryGameScreen from "./components/HistoryGameScreen";
import "./App.css";

const ALL_MIXED_MODES = ["flags", "capitals", "locate", "shapes", "languages", "population", "area"];

const DEFAULT_SETTINGS = {
  region: "All",
  difficulty: "medium",
  roundSize: 10,
  mixedModes: ALL_MIXED_MODES,
  timerSeconds: 60,
  lang: "en",
};

// screen: "subject" | "geo-landing" | "geo-game" | "history-landing" | "history-game"
function App() {
  const [screen, setScreen] = useState("subject");
  const [config, setConfig] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  function handleSubjectSelect(subject) {
    setScreen(subject === "geography" ? "geo-landing" : "history-landing");
  }

  function handleGeoStart(mode) {
    setConfig({ mode, region: settings.region, difficulty: settings.difficulty, count: settings.roundSize, mixedModes: settings.mixedModes, timerSeconds: settings.timerSeconds, lang: settings.lang });
    setScreen("geo-game");
  }

  function handleHistoryStart(mode) {
    setConfig({ mode, difficulty: settings.difficulty, count: settings.roundSize, timerSeconds: settings.timerSeconds, lang: settings.lang });
    setScreen("history-game");
  }

  return (
    <div className="app">
      {screen === "subject" && (
        <SubjectScreen lang={settings.lang} onSelect={handleSubjectSelect} />
      )}
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
    </div>
  );
}

export default App;
