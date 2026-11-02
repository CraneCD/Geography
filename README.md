# 🧠 Quiz — Geography, History, Logic & Science

A fast, multilingual (English / Español / Français) quiz app with four subjects and 41 modes:

| Subject | Modes |
|---|---|
| 🌍 **Geography** | Flags · Capitals · Locate on a map · Country shapes · Official languages · Neighbours · Currencies · Population · Area · Landmarks · Rivers & mountains · US states · Mixed |
| 📜 **History & Culture** | Famous people (portraits) · Which came first? · Historical events · Inventions · Art · Mixed |
| 🧮 **Logic & Numbers** | Arithmetic · Fractions & % · Number sequences · Guess the angle · Solve for x · Telling time · Roman numerals · Unit conversion · Word problems · Logic puzzles · Mixed |
| 🔬 **Science & Nature** | Animal ID · Animal compare · Animal traits · Plants · Elements · Human body · Body systems · Space: identify · Space: compare · Space missions · Mixed |

Every answer teaches something: a fact card or worked steps, a note on **why the option you picked is
wrong** (e.g. the flag you chose and whose it is), and a **Learn more** link to Wikipedia in your language.

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
| `npm run build:images` | Download, licence-check and self-host every quiz picture |
| `npm run build:flags` | Download flag SVGs for every country |
| `npm run build:facts` | Refresh population, area, capitals and currencies from Wikidata (`-- --sources-only` for article titles) |
| `npm run build:calibration -- stats.json` | Turn collected answer stats into difficulty calibration |

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
- **Images** (`npm run build:images`): downloads every picture once from Wikimedia Commons, keeps only
  freely licensed files, saves a 500 px WebP in `src/assets/quiz-images/` and records author, licence and
  source page (shown as the credit after answering). Items can pick a specific Commons file
  (`imageFile`), opt out (`imageFile: null`), or hide giveaway text (`imageEdit: { crop, blur }`).
  Nothing is loaded from Wikimedia at runtime.
- **Illustrations** (`npm run build:illustrations`): our own label-free anatomy drawings for organs with
  no suitable free photo.
- **Flags** (`npm run build:flags`) are downloaded once as SVG files into `src/assets/flags/`, so there
  is no flag CDN dependency.
- **Facts** (`npm run build:facts`): population (with the year it refers to), area, capitals in en/es/fr and
  ISO currencies from Wikidata into `countryFacts.json`, plus the es/fr Wikipedia title of every item for
  "Learn more" links and translated place names (`sources.json`). Values more than 35% away from the
  reviewed figures in `countriesExtra.js` are kept as they were and printed for a human to check; it also
  reports people whose birth/death years disagree with Wikidata. Land borders come from the map geometry,
  not Wikidata (whose list includes sea borders).
- **US states** (`build:geo`): outlines and the US map come from `us-atlas` (Albers USA).

## Answer statistics and difficulty calibration

The app records, per question, how often it is answered and answered correctly — in the browser's
`localStorage` only (`quiz:stats:v1`). To calibrate difficulty from real players:

1. Build with `VITE_STATS_ENDPOINT=https://your-endpoint` (any URL that accepts a POSTed JSON body, e.g. a
   small serverless function or a form backend). The app then sends anonymous batches
   `{ v: 1, events: [{ k, d, c, ms }] }` — question key, difficulty, correct (0/1) and time — with
   `navigator.sendBeacon`. No user id, cookies, IP-derived data or typed answers; nothing is sent when the
   browser sets Do Not Track, and nothing at all when the variable is unset (the default).
2. Collect the posted bodies into one or more JSON files and run `npm run build:calibration -- *.json`.
   Questions with at least 30 answers get their measured accuracy in `calibration.json`.
3. Easy rounds then prefer questions most players get right (≥ 75%) and Hard rounds those most miss
   (≤ 55%), for geography, history people/events and the science photo modes. Questions without data are
   always eligible, and a pool is never narrowed below a playable size.

## Content notes

- Everything is available in English, Spanish and French: UI, prompts, country/language names, history
  people, events, inventions and artworks (names and descriptions), and science names and facts.
  Capitals and place names (landmarks, rivers, mountains) use their usual Spanish/French forms.
- History covers every continent: people, events, inventions and art from Asia, Africa and the Americas
  as well as Europe, and women in every field.
- `docs/AUDIT.md` contains the original code and functionality audit and how each finding was addressed.

## Design

The UI follows the **Quiz Notebook** direction: graph-paper background, navy ink, hard-shadow cards, and a
highlighter colour per subject (yellow · orange · pink · mint, set by `data-subject` on `.app`). Type is
Space Grotesk with IBM Plex Mono for labels and numbers, both self-hosted via `@fontsource`. Icons are
`lucide-react` line icons (no emoji). All colours are tokens at the top of `src/index.css`, with a
"night notebook" variant under `prefers-color-scheme: dark`.
