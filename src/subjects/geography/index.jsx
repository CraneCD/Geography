import { lazy } from "react";
import { buildRound as countryRound } from "./generate.js";
import { featureRound, FEATURE_MODES } from "./features.js";

export function buildRound(settings, t) {
  return FEATURE_MODES.includes(settings.mode) ? featureRound(settings, t) : countryRound(settings, t);
}
// The world map geometry is only downloaded when a Locate question is shown.
export const views = { locate: lazy(() => import("./LocateQuestion.jsx")) };
