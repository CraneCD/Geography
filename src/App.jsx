import { useState } from "react";
import LandingScreen from "./components/LandingScreen";
import GameScreen from "./components/GameScreen";
import "./App.css";

function App() {
  const [config, setConfig] = useState(null);

  return (
    <div className="app">
      {!config ? (
        <LandingScreen onStart={setConfig} />
      ) : (
        <GameScreen config={config} onChangeMode={() => setConfig(null)} />
      )}
    </div>
  );
}

export default App;
