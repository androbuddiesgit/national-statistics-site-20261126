// NusaStats — entry program for make.fun's "best national statistics site" bounty.
// The site is plain static files under app/ (index.html, styles.css, app.js, data.json):
// no build step, no framework, no request to any other origin. This program hands it in:
// it copies app/ and screenshots/ beside this file into /output and writes
// /output/dossier.json with the vendored make.fun library (vendor/makefun-frontend.ts,
// the kit's copy, unchanged — the scorer rebuilds the dossier from its own copy and
// compares byte for byte).
//
// Run outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Caps mirror the gate scorer's own limits (see the kit's RULES.txt): at most 4
// screenshots of 256 KiB each, at most 993 files / 16 MiB under app/, and the
// dossier text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
