# Code & Functionality Audit — Quiz site (Geography, History, Logic, Science)

_Audit date: 2026-10-31 · Commit audited: `da77930`_

## How this was audited

- Read every component, generator (`src/utils/*`), and the data/i18n modules.
- `npm run lint` (fails with 15 errors and 1 warning) and `npm run build` (passes, with a chunk-size warning).
- Wrote a headless harness that loads the real question generators through Vite and builds thousands of rounds for every
  mode × region × difficulty combination, then checked option counts, answer positions, duplicates, and formatting.
- Ran a Playwright smoke test at phone width (390 px) through each subject to confirm the bugs in the UI and capture console errors.

Numbers quoted below come from that harness unless noted otherwise.

---

## Executive summary

The app is feature-rich (4 subjects, 23 quiz modes, 3 UI languages, 4 difficulties) and the UI is clean and responsive.
The main problems are in **question generation**, where several bugs make questions trivial or unanswerable. Most of
them are cheap to fix:

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 Critical | Region filter + Easy produces **1-option questions**; + Medium produces 3 options | Any non-"All" region on Easy is a free 100%. Reproduced in the browser |
| 2 | 🔴 Critical | History "Events" (and invention-year) MCQ: the correct year is **always the 3rd-smallest option** (3000/3000) | The mode can be beaten without knowing anything |
| 3 | 🔴 High | `countryPaths` ID mismatch drops **23 major countries** (Argentina, Australia, Brazil, Austria, Belgium, Bolivia, …) from Shapes and Locate | Content silently missing |
| 4 | 🟠 High | "Medium" distractors are effectively Easy (1% same-region vs. 22% on Hard), and always the alphabetically first neighbours (Afghanistan, Albania, Algeria…) | The difficulty setting is misleading |
| 5 | 🟠 High | Logic percentages: 28% of Hard/Expert answers contain float noise (`98% of 58 → 56.839999999999996`) | A correct typed answer is marked wrong |
| 6 | 🟠 High | Timer can double-record an answer (it keeps running during answer feedback and on the Locate "Next" screen; it also calls `onExpire` inside a state updater) | Scores and totals become inconsistent |
| 7 | 🟠 High | Image questions depend on live Wikipedia REST calls and download **original-resolution** files | Slow on mobile; returned HTTP 429 during the smoke test, which showed "Image unavailable" and left the question unanswerable |
| 8 | 🟡 Medium | i18n is partial: summary, progress bar, Science prompts, History content, Logic explanations, region and language names are English-only | The ES/FR experience is inconsistent |
| 9 | 🟡 Medium | Lint is red, there are no tests or CI, and the README is the Vite template | Regressions like #1–#3 ship unnoticed |
| 10 | 🟡 Medium | Heavy duplication: 4 near-identical GameScreens, 4 landing screens, `normalize`/`shuffle`/option-button code copied 3–8× | Each bug has to be fixed in several places |

---

## 1. Functional bugs (verified)

### 1.1 Region filter breaks multiple-choice options 🔴
`src/utils/game.js:31-45` — `getDistractors` takes Easy distractors **only from other regions** and Medium distractors from
"2 same-region + other regions". When a region is selected, `pool` is already filtered to that region, so `otherRegion` is empty:

| Region ≠ All | Easy | Medium | Hard/Expert |
|---|---|---|---|
| Options shown | **1** | **3** | 4 |

This affects Flags, Capitals, and Shapes for every region. Screenshot evidence: Europe + Easy shows a Montenegro flag with a single "Montenegro" button.

**Fix:** build distractors from the full country list (or fall back to it) when the regional pool is too small, and always guarantee 4 options.

### 1.2 Medium difficulty is mis-implemented 🟠
`game.js:37` slices `sameRegion` **before shuffling**, so the only same-region distractors ever used are the first two
alphabetically. They are then shuffled into ~150 other-region countries, so they almost never appear. The same pattern
(`slice` before `shuffle`) is in `historyGame.js:16, 26, 35`.

**Fix:** shuffle first, then slice. Define difficulty explicitly, e.g. Easy = 0 same-region, Medium = 1–2 same-region, Hard = 3 same-region or neighbours with similar flags or shapes.

### 1.3 Zero-padded TopoJSON IDs drop 23 countries from Shapes/Locate 🔴
`world-atlas` uses IDs like `"032"`, but `src/data/countryIds.js` stores `"32"`. `countryPaths.js:16` compares
`String(feat.id) === numericId`, so every country with an ISO numeric code < 100 is missing:

`AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BE BZ BT BO BA BW BR BN`

Another 25 microstates are simply absent from the 110m atlas (expected). In total only **143 of 191** countries can appear in Shapes or Locate.
`LocateQuestion.jsx` has the same comparison, so it would mark these countries wrong even if they were in the pool.

**Fix:** compare with `String(Number(feat.id))`, or pad the IDs to 3 digits. Consider the 50m atlas, or a "small-country circle" for microstates in Locate.

### 1.4 History year questions have a fixed answer position 🔴
`historyGame.js:39-53` adds `year ± step` in a fixed order and stops at 4 options, so the options are always
`{y-2s, y-s, y, y+s}`. The correct answer is always the **3rd-lowest**. The step sizes are also round numbers, and 78 of 3000 questions
offered future years (e.g. 2051), which are easy to rule out.

**Fix:** pick a random offset for the correct answer within the window (e.g. choose k ∈ {0..3} and generate `y + (i-k)·step`), add jitter, and clamp to ≤ the current year.

### 1.5 Timer race conditions 🟠
- `Timer.jsx:15-20` calls `onExpire()` **inside a `setRemaining` updater**. React StrictMode calls updaters twice in dev, so the answer is recorded twice. Side effects should not run in updaters.
- `GameScreen.handleAnswer` pauses the timer only when the answer *callback* runs. Answer components wait 900–1600 ms before calling it, so if the timer reaches 0 during that window, the question gets recorded **twice** (once wrong, once correct). Then `results.length` is larger than the number of questions.
- `LocateQuestion.jsx:76` waits for the user to press "Next", but the timer keeps running after the map click. A correct answer can still expire as wrong.

**Fix:** move "answered" state into the game screen (or a `useQuizSession` hook) and ignore a second answer for the same `idx`. Pause the timer when the answer is selected, not when it's committed. Call `onExpire` from an effect that watches `remaining === 0`.

### 1.6 Logic generator defects 🟠
- **Float noise:** `logicGenerators.js:165` computes `(percent / 100) * base`. Use `Math.round(percent * base) / 100`. `MathQuestion.jsx:99` also compares percentage answers with strict `===` (no tolerance), so `56.84` is marked wrong.
- **Signed-number rendering:** Hard/Expert algebra shows `9x − 7 = 2x + -91` and steps like `−91 − (−7)` (`logicGenerators.js:504, 525-532`). Hard can also print `1x`.
- **Medium division is almost always "÷ = 2"** (87% of answers; `logicGenerators.js:125`): with `rMax = 9`, `floor(9/divisor)` is 1 for every divisor ≥ 5.
- Expert compound-expression loop condition `!isInteger || answer < 0 && attempts < 50` has an operator-precedence bug (it should be parenthesised).
- **Angle:** the wrap-around tolerance treats a 355° reflex angle as matching a 5° guess.

### 1.7 History content defects 🟡
- Inventor and artist questions pad with a literal **"Unknown"** option when distractors share a name (85 of 6000 questions; `historyGame.js:101, 130`).
- "Who came first?" compares a person's **birth year** with an event's year, which isn't obvious to the player. Ties (6 of 3000) always mark the right-hand card wrong (`ChronologyQuestion.jsx:40`).
- In the summary, missed "Who came first?" questions show as **"?"** because they have no `correct` field (`HistoryGameScreen.jsx:40`).
- Expert typed answers require the exact full name ("Einstein" is wrong). Add surname matching and fuzzy matching (edit distance ≤ 1–2).

### 1.8 Geography content defects 🟡
- **Ambiguous language answers:** `countriesExtra` stores one language per country (Canada = English, Belgium = Dutch, Switzerland = German, Rwanda = French).
  The prompt asks "What is **an** official language of…", so a distractor like "French" for Canada or Belgium is also correct but gets marked wrong.
  Store a list of official languages and exclude all of them from the distractors.
- The Languages mode-card description ("Which country speaks this language?") is the reverse of the actual prompt.
- Missed Population/Area questions in the summary list only the left-hand country (`GameScreen.jsx`, `country: question.correct ?? question.left`).
- The Locate map always shows the whole world, even when a region is selected.

### 1.9 Science defects 🟡
- Human Body uses `pickOne` with replacement (`scienceGame.js:252`). A 20-question round over a 10-item pool had 7–12 repeats.
- Small pools truncate rounds without telling the player: Space-photo Easy has 8 questions max and Hard has 5. Elements covers only 36 of 118.
- "Expert" isn't defined for Elements or Body, so it silently behaves like Medium (`scienceGame.js:213`).
- `lang` is ignored, so every Science prompt is English.

### 1.10 Settings plumbing 🟡
- `App.jsx:48,53` doesn't pass `timerSeconds` to Logic or Science, so their timer code is dead. History gets the Geography timer value but has no timer control, and it ignores the "disabled on Easy & Expert" rule that Geography applies.
- `GameScreen` has a full **practice mode** (re-ask missed questions), but nothing can turn it on.
- Settings aren't persisted (no `localStorage`) and there is no routing. A refresh or the browser Back button leaves the app and loses all state.

---

## 2. Code-quality findings

| Area | Finding |
|---|---|
| **Lint** | `npm run lint` fails (15 errors): 8 unused variables, 5 `set-state-in-effect`, 1 "component created during render" (`FlagImage.jsx:53`, `lazy()` called while rendering), 1 missing effect dependency (`Timer.jsx:24`). |
| **Duplication** | `GameScreen`, `HistoryGameScreen`, `LogicGameScreen`, and `ScienceGameScreen` are ~130 lines each and ~80% identical (state, `handleAnswer`, restart, timer, exit-confirm). There are 4 landing screens with copied `LANGUAGES`/`DIFFICULTIES`/label tables. `normalize()` appears in 4 files with different alias rules, `shuffle` in 3, and the Wikipedia fetch-and-cache code in 4 (`HistoryImageQuestion`, `ScienceImageQuestion`, `ScienceCompareQuestion`, `BodyQuestion`). The MCQ option-button block is repeated in ~8 components. |
| **Data model** | Non-geography results are squeezed into a `country: {name, code, capital, region}` shape so that `SummaryScreen` can render them. A generic `{prompt, correctLabel, userLabel, explanation}` result would fit all subjects. |
| **i18n** | Strings are split between `i18n/strings.jsx` and inline `{en, es, fr}` maps in at least 8 components. `SummaryScreen` ("Round Complete!", "Missed", "accuracy", "Capital:"), `ProgressBar` ("Question", "Score"), `ModeCard` aria-label, `MathQuestion` ("Steps:"), region names, and language names are hard-coded English. `<html lang="en">` never changes. |
| **Dependencies** | `react-simple-maps@3` is unmaintained and only peer-supports React ≤ 18, which is why `.npmrc` has `legacy-peer-deps=true`. `d3-geo` and `topojson-client` are imported directly but are only transitive dependencies (not listed in `package.json`). `playwright` is in devDependencies but unused by scripts. `prop-types` is only there for that peer. |
| **Dead files** | `src/assets/{hero.png, react.svg, vite.svg}`, `public/icons.svg`, and `src/App.css` (1 comment line) are unused. |
| **Project metadata** | `README.md` is the Vite template. `<title>` is "geography". `package.json` name/version are template defaults. |
| **Tests / CI** | None. Every bug in §1.1–1.6 would be caught by a ~50-line generator test. |

---

## 3. Performance

- **Single 674 kB JS chunk (221 kB gzip).** It includes the world atlas, all 4 history datasets, and all subjects. `countryPaths.js` also computes a Mercator projection for all 177 countries **at module load**, even for someone who only plays Logic. Lazy-load each subject (`React.lazy`) and compute shape paths on demand (or precompute them at build time into a JSON file).
- **Original-resolution Wikipedia images.** Four components prefer `originalimage` over `thumbnail`, and for famous paintings that can be a multi-MB to tens-of-MB file. Request a sized thumbnail instead (e.g. swap the width segment in the thumbnail URL to ~640 px).
- **No prefetching.** Image questions start fetching when they appear. Prefetch question `n+1` while the user answers `n`.
- **Flag fallback** pulls the whole `country-flag-icons/react/3x2` bundle (235 kB) on the first CDN failure. That's acceptable as a fallback, but bundling local SVG flags would remove the dependency on `flagcdn.com` entirely.

## 4. Accessibility

- The Timer has `aria-live="polite"` and re-renders every second, so screen readers announce a countdown constantly. Announce only at thresholds (e.g. 10s, 5s).
- Locate exposes 177 focusable map paths with country **names** as `aria-label`s, which reveals the answer to screen-reader users. The mode isn't keyboard-playable in practice. Offer an accessible alternative (e.g. a type-ahead combobox).
- Option buttons use `aria-disabled` but stay clickable and focusable. Focus isn't moved to the new question after advancing.
- `<label htmlFor="lang-select">` points to an element that doesn't exist. Several `<label>` elements label pill groups instead of form controls (use `<fieldset>/<legend>` or `<span id>` + `aria-labelledby`).
- Several screens have no `prefers-reduced-motion` handling for animations.

## 5. Resilience / external dependencies

| Dependency | Used for | Risk |
|---|---|---|
| `en.wikipedia.org/api/rest_v1` | Portraits, paintings, animals, body, space photos (~250 titles) | Rate limiting (429 seen during testing), title renames, and image changes on the live site can make questions unanswerable or wrong. No retry, no attribution |
| `flagcdn.com` | All flags | Reasonable, with a bundled fallback |

Recommendation: add a build-time script that resolves each `wikiTitle` once, stores a fixed thumbnail URL plus attribution and licence in the data files (or downloads the images to `public/`), and validates that every image resolves. That makes the image modes deterministic and work offline after the first load.

---

## 6. Improvement plan

Phases are ordered by value per effort. Each phase is independently shippable.

### Phase 0 — Safety net (≈ 0.5 day)
1. Fix the 15 lint errors and make `npm run lint` pass.
2. Add **Vitest** with generator tests that would have caught §1.1–1.6:
   - every MCQ question has exactly 4 unique options containing the correct answer, for every mode × region × difficulty;
   - the correct answer's position is roughly uniform;
   - every country has a shape path (or is on an explicit "microstate" allow-list);
   - numeric answers have ≤ 2 decimal places, and rendered prompts contain no `+ -`;
   - every round has `count` questions (or the UI is told it has fewer).
3. Add a GitHub Actions workflow: `npm ci → lint → test → build`.
4. Replace the README with a real one: what the app is, how to run it, and how to add questions.

### Phase 1 — Correctness fixes (≈ 1–2 days)
1. Distractor engine: shuffle before slicing, fall back to the global pool when a region is too small, and redefine Easy/Medium/Hard (§1.1, §1.2).
2. Fix the TopoJSON ID padding (§1.3).
3. Randomise the year-option window, remove future years, and stop padding with "Unknown" (§1.4, §1.7).
4. Timer: single-answer guard per question, pause on selection, and no side effects in updaters. Pause the timer on the Locate feedback screen (§1.5).
5. Logic: integer-safe percentages, numeric tolerance for decimals, signed-term formatting helper, better division ranges, and the precedence fix (§1.6).
6. Languages mode: store multiple official languages and exclude them from distractors (§1.8).
7. Science: sample Body without replacement, define Expert for all modes, and show the real round length (§1.9).
8. Summary: record what the user picked and what was correct for every question type, including Who-came-first and Compare.

### Phase 2 — Architecture consolidation (≈ 2–3 days)
1. Extract a **`useQuizSession(buildRound, config)`** hook (questions, idx, score, results, timer, exit-confirm, practice re-queue) and a single `<QuizShell>` component. Delete the 4 duplicated GameScreens.
2. Make a single **`<SubjectLanding>`** driven by a per-subject config (modes, icons, which options apply).
3. Add a shared **`<ChoiceGrid>`** for all MCQ buttons, a shared **`<AnswerInput>`** with one `normalize`/alias/fuzzy-match module, and a shared **`useWikiImage`** hook.
4. Add a uniform question/result schema across subjects: `{type, prompt, options, correct, explanation, media}`, and `{wasCorrect, prompt, correctLabel, userLabel}`.
5. Move all UI strings into `i18n/` (one file per language), add a `t()` helper with English fallback, and set `document.documentElement.lang`.

### Phase 3 — UX & product (≈ 2–4 days)
1. Persist settings and best scores per mode in `localStorage`. Add hash routing (`#/geography/flags`) so Back and Refresh work and modes can be linked.
2. Expose **Practice mode** (it already exists) and a "Review mistakes" button on the summary.
3. Make the timer settings consistent across subjects. Reconsider the 1–5 minute per-question options (10/20/30 s is more typical) or make it a per-round timer.
4. Summary: localise it, show the correct answer and the user's answer for each miss, and add a "share score" option.
5. Locate: zoom to the selected region; add tap targets for microstates.
6. Translate the content layer (region names, language names, Science prompts, History event names and descriptions) or label the content as English-only in ES/FR.

### Phase 4 — Performance & resilience (≈ 1–2 days)
1. Code-split per subject with `React.lazy`. Precompute shape paths at build time and drop runtime `d3-geo`/`topojson` from the main chunk.
2. Build-time image pipeline: resolve Wikipedia titles, then store sized thumbnails and attribution, with CI validation. Prefetch the next question's image.
3. Replace `react-simple-maps` with a small in-house SVG map (the paths can reuse the precomputed data), then remove `legacy-peer-deps`.
4. Optional: PWA / service worker for offline play.

### Phase 5 — Accessibility pass (≈ 1 day)
Fix focus management between questions, reduce timer announcements, remove answer-revealing `aria-label`s on the map, fix the label/fieldset semantics, and add `prefers-reduced-motion` handling. Optionally add an automated axe check in Playwright.

---

### Suggested first PR
Phase 0 plus fixes 1–4 from Phase 1. That's about a day of work. It removes the three critical issues and the timer race, and puts tests in place so they don't come back.
