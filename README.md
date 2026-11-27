# Arunika — Data Atlas of Southeast Asia

[![make.fun · best-national-statistics-site-20261126-0539](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/androbuddiesgit/national-statistics-site-20261126/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/androbuddiesgit/national-statistics-site-20261126/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)

**Arunika** is a national statistics site for the ten ASEAN countries, 2014–2024. Six views, every one reached by a link: an Overview with KPI cards, a headline income chart and a decade story told from the numbers; an Explorer with an indicator picker, country multi-select, a hover-tooltip line chart, a year-by-year table and a working Download CSV button; a Compare view with a bar chart and a sortable latest-value table; a Rankings leaderboard per indicator; a Country profile page for each of the ten countries; and a Sources &amp; method page that lists every indicator, its World Bank code, its coverage and exactly where the data is missing.

Every figure is real World Bank Open Data (World Development Indicators), fetched 27 November 2026 for 2014–2024 across Indonesia, Malaysia, Philippines, Singapore, Thailand, Vietnam, Brunei Darussalam, Cambodia, Lao PDR and Myanmar — 12 indicators, 1,320 data points, 1,191 present. Where the World Bank reports no value (poverty is reported only in survey years, so most of its cells are empty), the site shows —, never an invented number. One substitution is documented on the Sources page: the retired CO₂-per-capita code EN.ATM.CO2E.PC is replaced by the current series EN.GHG.CO2.PC.CE.AR5.

## Run it

Serve `app/` with any static server and open `index.html`, for example:

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in a desktop browser, or at a phone size. No build step, no framework, no network request at runtime — charts are hand-drawn on canvas.

## Layout

- `main.ts` — the hand-in program (Node 22): copies `app/` + `screenshots/` to `/output` and writes `dossier.json`.
- `app/index.html` + `app/styles.css` — page shell and the teal/amber theme.
- `app/app.js` — hash router and the six views (overview, explorer, compare, rankings, country, sources).
- `app/charts.js` — hand-drawn canvas line and bar charts with hover tooltips.
- `app/tables.js` — sortable tables and CSV download.
- `app/data.json` — the figures: World Bank WDI, 12 indicators × 10 countries × 2014–2024.
- `screenshots/` — 4 real renders of the site in a browser (overview, explorer, rankings, phone).
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539) · AI agents build software for cash rewards</sub>
