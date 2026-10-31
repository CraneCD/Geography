import { useState, useRef, useMemo, useId, useEffect } from "react";
import worldMap from "../../data/generated/worldMap.json";
import regionViews from "../../data/generated/regionViews.json";
import { countries } from "../../data/countries.js";
import { localName } from "./generate.js";

const W = worldMap.width;
const H = worldMap.height;
const FULL = { x: 0, y: 0, w: W, h: H };
const MIN_W = W / 24;
const byCode = Object.fromEntries(countries.map((c) => [c.code, c]));

function fitView([x0, y0, x1, y1], pad = 0.08) {
  // Keep the map's aspect ratio so the frame doesn't distort.
  const boxW = (x1 - x0) * (1 + pad * 2);
  const boxH = (y1 - y0) * (1 + pad * 2);
  const w = Math.max(boxW / boxH > W / H ? boxW : (boxH * W) / H, MIN_W);
  const h = (w * H) / W;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return clamp({ x: cx - w / 2, y: cy - h / 2, w, h });
}

function clamp(v) {
  const w = Math.min(Math.max(v.w, MIN_W), W);
  const h = (w * H) / W;
  return {
    w, h,
    x: Math.min(Math.max(v.x, -w * 0.25), W - w * 0.75),
    y: Math.min(Math.max(v.y, -h * 0.25), H - h * 0.75),
  };
}

function zoomAt(v, factor, px, py) {
  const w = Math.min(Math.max(v.w * factor, MIN_W), W);
  const k = w / v.w;
  return clamp({ x: px - (px - v.x) * k, y: py - (py - v.y) * k, w, h: (w * H) / W });
}

function boundsOf(code) {
  const c = worldMap.countries[code];
  if (c) return c.bbox;
  const p = worldMap.points[code];
  return p ? [p[0] - 10, p[1] - 10, p[0] + 10, p[1] + 10] : [0, 0, W, H];
}

export default function LocateQuestion({ question, answer, onAnswer, t }) {
  const initial = useMemo(
    () => (question.region && regionViews[question.region] ? fitView(regionViews[question.region], 0) : FULL),
    [question.region],
  );
  const [view, setView] = useState(initial);
  const [listChoice, setListChoice] = useState("");
  const svgRef = useRef(null);
  const pointers = useRef(new Map());
  const drag = useRef(null);
  const listId = useId();
  const lang = t.lang;
  const locked = Boolean(answer);
  const target = question.code;

  // Scroll-wheel zoom needs a non-passive listener to prevent page scrolling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const [px, py] = toSvg(e.clientX, e.clientY);
      setView((v) => zoomAt(v, e.deltaY > 0 ? 1.2 : 1 / 1.2, px, py));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  function toSvg(clientX, clientY) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }

  function choose(code) {
    if (locked || !code) return;
    const correct = code === target;
    onAnswer({ correct, given: localName(byCode[code], lang), givenId: code });
    if (!correct) {
      // Frame both the wrong pick and the right answer so the player can see where it is.
      const [a0, b0, a1, b1] = boundsOf(target);
      const [c0, d0, c1, d1] = boundsOf(code);
      setView(fitView([Math.min(a0, c0), Math.min(b0, d0), Math.max(a1, c1), Math.max(b1, d1)], 0.15));
    }
  }

  // ── Pointer handling: tap to choose, drag to pan, two fingers to pinch-zoom ──
  function onPointerDown(e) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { startX: e.clientX, startY: e.clientY, moved: false, view, code: e.target.dataset?.code };
    } else {
      drag.current = { ...drag.current, moved: true, pinch: true };
    }
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = drag.current;
    if (!d) return;

    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      const others = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)?.[1];
      const before = Math.hypot(prev.x - others.x, prev.y - others.y);
      const after = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (before > 0 && after > 0) {
        const [px, py] = toSvg((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        setView((v) => zoomAt(v, before / after, px, py));
      }
      return;
    }

    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 6) {
      d.moved = true;
      svgRef.current.setPointerCapture?.(e.pointerId);
    }
    if (d.moved && !d.pinch) {
      const rect = svgRef.current.getBoundingClientRect();
      const scale = Math.max(d.view.w / rect.width, d.view.h / rect.height);
      setView(clamp({ ...d.view, x: d.view.x - (e.clientX - d.startX) * scale, y: d.view.y - (e.clientY - d.startY) * scale }));
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    const d = drag.current;
    if (pointers.current.size === 0) {
      if (d && !d.moved && d.code) choose(d.code);
      drag.current = null;
    }
  }

  const zoomBy = (f) => setView((v) => zoomAt(v, f, v.x + v.w / 2, v.y + v.h / 2));

  const fillOf = (code) => {
    if (!locked) return undefined;
    if (code === target) return "map-country--correct";
    if (code === answer.givenId) return "map-country--wrong";
    return undefined;
  };

  const s = view.w / W; // keeps points and strokes a constant on-screen size
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => localName(a, lang).localeCompare(localName(b, lang), lang)),
    [lang],
  );

  return (
    <>
      <h2 className="question-prompt">{question.prompt}</h2>
      <p className="locate-hint">{t.geo.locateHint}</p>

      <div className="map-container">
        <svg
          ref={svgRef}
          className="world-map"
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <rect x={-W} y={-H} width={W * 3} height={H * 3} className="map-ocean" />
          {worldMap.other.map((d, i) => <path key={i} d={d} className="map-land" style={{ strokeWidth: 0.5 * s }} />)}
          {Object.entries(worldMap.countries).map(([code, c]) => (
            <path
              key={code}
              d={c.d}
              data-code={code}
              className={`map-country ${fillOf(code) ?? ""}${locked ? "" : " map-country--active"}`}
              style={{ strokeWidth: 0.5 * s }}
            />
          ))}
          {Object.entries(worldMap.points).map(([code, [x, y]]) => (
            <g key={code} className={`map-point ${fillOf(code) ?? ""}${locked ? "" : " map-country--active"}`}>
              <circle cx={x} cy={y} r={9 * s} data-code={code} className="map-point__hit" />
              <circle cx={x} cy={y} r={3 * s} data-code={code} className="map-point__dot" style={{ strokeWidth: 0.8 * s }} />
            </g>
          ))}
        </svg>

        <div className="map-controls">
          <button type="button" className="map-btn" onClick={() => zoomBy(1 / 1.5)} aria-label={t.geo.zoomIn}>+</button>
          <button type="button" className="map-btn" onClick={() => zoomBy(1.5)} aria-label={t.geo.zoomOut}>−</button>
          <button type="button" className="map-btn" onClick={() => setView(initial)} aria-label={t.geo.resetView}>⟲</button>
          {initial !== FULL && (
            <button type="button" className="map-btn" onClick={() => setView(FULL)} aria-label={t.geo.worldView}>🌐</button>
          )}
        </div>
      </div>

      {/* Accessible alternative to clicking the map (keyboard / screen readers). */}
      <form
        className="locate-list"
        onSubmit={(e) => { e.preventDefault(); choose(listChoice); }}
      >
        <label htmlFor={listId} className="locate-list__label">{t.geo.locateList}</label>
        <div className="locate-list__row">
          <select id={listId} className="option-select" value={listChoice} disabled={locked} onChange={(e) => setListChoice(e.target.value)}>
            <option value="">{t.geo.locateListPlaceholder}</option>
            {sortedCountries.map((c) => <option key={c.code} value={c.code}>{localName(c, lang)}</option>)}
          </select>
          <button type="submit" className="btn btn--secondary" disabled={locked || !listChoice}>{t.geo.confirm}</button>
        </div>
      </form>
    </>
  );
}
