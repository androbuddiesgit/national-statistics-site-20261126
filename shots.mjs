// Arunika screenshots — renders the real site in Chromium and captures 4 views.
// Usage: node shots.mjs   (serves app/ on 127.0.0.1:8125, shoots, exits)
import { chromium } from '/home/hatch/.npm-global/lib/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('app/', import.meta.url));
const shotsDir = fileURLToPath(new URL('screenshots/', import.meta.url));
await mkdir(shotsDir, { recursive: true });
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(8125, '127.0.0.1', r));

const browser = await chromium.launch();
const views = [
  { name: '1-overview.jpg', hash: '#/overview', width: 1280, height: 1000 },
  { name: '2-explorer.jpg', hash: '#/explorer', width: 1280, height: 860 },
  { name: '3-rankings.jpg', hash: '#/rankings', width: 1280, height: 860 },
  { name: '4-overview-phone.jpg', hash: '#/overview', width: 390, height: 844 },
];
for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  const errors = [], external = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:8125')) external.push(r.url()); });
  await page.goto('http://127.0.0.1:8125/' + v.hash, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(shotsDir, v.name), type: 'jpeg', quality: 82 });
  const size = (await stat(join(shotsDir, v.name))).size;
  console.log(v.name, v.width + 'x' + v.height, size + ' bytes', 'errors:', JSON.stringify(errors), 'external:', JSON.stringify(external));
  await page.close();
}
await browser.close();
server.close();
