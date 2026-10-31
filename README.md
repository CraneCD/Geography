# 🧠 Quiz — Geography, History, Logic & Science

A fast, multilingual (English / Español / Français) quiz app with four subjects and 27 modes:

| Subject | Modes |
|---|---|
| 🌍 **Geography** | Flags · Capitals · Locate on a map · Country shapes · Official languages · Population · Area · Mixed |
| 📜 **History & Culture** | Famous people (portraits) · Which came first? · Historical events · Inventions · Art · Mixed |
| 🧮 **Logic & Numbers** | Arithmetic · Fractions & % · Number sequences · Guess the angle · Solve for x · Mixed |
| 🔬 **Science & Nature** | Animal ID · Animal compare · Elements · Human body · Space: identify · Space: compare · Mixed |

Every subject supports four difficulties (Expert = type the answer), a per-question timer, a **practice mode**
that re-asks missed questions, **review mistakes** after a round, and personal bests per mode. Settings are
remembered, and every screen has its own URL (`#/geography/flags`), so Back and Refresh work as expected.

## Getting started

```bash
npm ci
npm run dev      # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm test` | Run the Vitest suite (question generators, answer matching, session logic, translations) |
| `npm run lint` | ESLint |
| `npm run check` | Lint + test + production build (what CI runs) |
| `npm run build` | Production build into `dist/` |
| `npm run build:geo` | Regenerate map geometry in `src/data/generated/` (see below) |
| `npm run build:images` | Resolve Wikipedia image thumbnails into `src/data/generated/images.json` |

## Project layout

```
src/
  App.jsx                 hash router + persisted settings
  components/
    SubjectScreen.jsx     subject picker
    SubjectLanding.jsx    one landing screen for every subject (modes + options)
    quiz/                 shared quiz engine UI: QuizScreen, QuestionView, ChoiceGrid,
                          AnswerInput, AnswerFooter, Media, SummaryScreen, header widgets
  hooks/
    useQuizSession.js     quiz state machine (answers, timer, practice re-queue, auto-advance)
    useSettings.js        validated settings persisted to localStorage
    useHashRoute.js       #/subject/mode routing
  subjects/
    catalog.js            subject + mode metadata (main bundle); each subject is lazy-loaded
    geography/ history/ logic/ science/
      generate.js         pure question generators (+ generate.test.js)
      index.js(x)         entry point: { buildRound, views }
      *.jsx               custom views (world map, angle)
  data/                   quiz content; data/generated/ is produced by the scripts
  i18n/                   en.js · es.js · fr.js (English is the fallback for missing keys)
  lib/                    random, text matching, formatting, storage helpers
scripts/                  build-time data pipelines (map geometry, image manifest)
```

### Question schema

All generators return plain objects rendered by the shared engine:

```js
{
  key, type, prompt,
  kind: "choice" | "text" | "compare" | "locate" | "angle",
  options: [{ id, label }], correctId,          // choice
  accepted: [...], match: { surname, exclude }, // text (or check: (input) => boolean)
  items: [{ id, label, value, media }],         // compare
  media: { kind: "flag" | "flagThumb" | "shape" | "image" | "element" | "sequence", ... },
  correctLabel,                                 // shown in feedback and the summary
  note, explanation, steps,                     // shown after answering
  review: { title, flag?, shape? },             // summary row
}
```

To add a mode: add its id to `subjects/catalog.js`, add titles/descriptions/type label to `i18n/*.js`, and
handle it in the subject's `generate.js` (with a test). A new interaction type only needs a view
registered in the subject's `views` map.

## Data pipelines

- **Map geometry** (`npm run build:geo`): projects `world-atlas` TopoJSON once at build time into
  per-country outline paths, a world map, microstate points, and region frames. The browser never loads
  d3 or TopoJSON. CI fails if the committed output is stale.
- **Images** (`npm run build:images`): resolves each `wikiTitle` in the data to a fixed 500 px Wikimedia
  thumbnail and the article URL (shown as an image credit after answering). Picture questions only use
  items that resolved, so a missing image can never produce an unanswerable question. The test suite
  lists titles that still need fixing.
- **Flags** are bundled from `country-flag-icons` as individual SVG files, so there is no flag CDN
  dependency.

## Content notes

- History names and descriptions, science facts, and capital-city names are in English in every UI
  language. Everything else (UI, prompts, country, language, animal, planet, element, and body-part
  names) is translated.
- `docs/AUDIT.md` contains the original code and functionality audit and how each finding was addressed.

## Design

The UI follows the **Quiz Notebook** direction: graph-paper background, navy ink, hard-shadow cards, and a
highlighter colour per subject (yellow · orange · pink · mint, set by `data-subject` on `.app`). Type is
Space Grotesk with IBM Plex Mono for labels and numbers, both self-hosted via `@fontsource`. Icons are
`lucide-react` line icons (no emoji). All colours are tokens at the top of `src/index.css`, with a
"night notebook" variant under `prefers-color-scheme: dark`.
