import { useEffect, useRef, useState } from "react";

export default function Timer({ duration, onExpire, paused }) {
  const [remaining, setRemaining] = useState(duration);
  const ref = useRef(null);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (paused) return;
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(ref.current);
          onExpire();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [paused, duration]);

  const pct = Math.round((remaining / duration) * 100);
  const urgent = remaining <= 5;

  return (
    <div className={`timer ${urgent ? "timer--urgent" : ""}`} aria-live="polite" aria-atomic="true">
      <div
        className="timer__ring"
        style={{ "--pct": pct }}
        aria-label={`${remaining} seconds remaining`}
      >
        {remaining}s
      </div>
    </div>
  );
}
