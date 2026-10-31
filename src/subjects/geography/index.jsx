import { lazy } from "react";

export { buildRound } from "./generate.js";
// The world map geometry is only downloaded when a Locate question is shown.
export const views = { locate: lazy(() => import("./LocateQuestion.jsx")) };
