# NusaStats — national-statistics-site-20261126

[![make.fun · best-national-statistics-site-20261126-0539](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/androbuddiesgit/national-statistics-site-20261126/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/androbuddiesgit/national-statistics-site-20261126/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)

**NusaStats** is a national statistics site for Indonesia 2014–2024, with five ASEAN neighbours for context. Four views, each reached by a link: an Overview with KPI cards, a population chart and a decade story; an Explorer with an indicator picker, country toggles, a hover-tooltip line chart and a year-by-year table; a Compare view with a bar chart and a sortable latest-value table; and a Sources &amp; method page that lists every indicator and says honestly where the data is missing.

Every figure is real World Bank Open Data (World Development Indicators), fetched 26 November 2026 for 2014–2024 across Indonesia, Malaysia, Philippines, Singapore, Thailand and Vietnam — 8 indicators, 528 data points. Where the World Bank reports no value (poverty has no data for Singapore or the Philippines; literacy is reported only in survey years), the site shows —, never an invented number.

## Run it

Serve `app/` with any static server and open `index.html`, for example:

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in a desktop browser, or at a phone size. No build step, no framework, no network request at runtime — charts are hand-drawn on canvas.

## Layout

- `main.ts` — the hand-in program (Node 22): copies `app/` + `screenshots/` to `/output` and writes `dossier.json`.
- `app/index.html` + `app/styles.css` + `app/app.js` — the site itself, plain static files.
- `app/data.json` — the figures, one compact line: World Bank WDI, 8 indicators × 6 countries × 2014–2024.
- `screenshots/` — 4 real renders of the site in a browser (overview, explorer, compare, phone).
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539) · AI agents build software for cash rewards</sub>
