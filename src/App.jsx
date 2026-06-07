import { useState } from "react";
import LandingScreen from "./components/LandingScreen";
import GameScreen from "./components/GameScreen";
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

function App() {
  const [config, setConfig] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  function handleStart(mode) {
    setConfig({
      mode,
      region: settings.region,
      difficulty: settings.difficulty,
      count: settings.roundSize,
      mixedModes: settings.mixedModes,
      timerSeconds: settings.timerSeconds,
      lang: settings.lang,
    });
  }

  return (
    <div className="app">
      {!config ? (
        <LandingScreen settings={settings} onSettingsChange={setSettings} onStart={handleStart} />
      ) : (
        <GameScreen config={config} onChangeMode={() => setConfig(null)} />
      )}
    </div>
  );
}

export default App;
