// Arunika functional checks — every route renders, every control acts.
// Usage: node verify.mjs
import { chromium } from '/home/hatch/.npm-global/lib/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('app/', import.meta.url));
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  try { const b = await readFile(join(root, p)); res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(8126, '127.0.0.1', r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const out = [];
async function go(hash) {
  await page.goto('http://127.0.0.1:8126/' + hash, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  out.push(hash + ' h1=' + JSON.stringify(await page.textContent('h1')));
}
await go('#/overview');
out.push('overview KPI cards: ' + await page.locator('.kpi').count());
out.push('overview country links: ' + await page.locator('.countrylist a').count());
await go('#/explorer');
await page.selectOption('#exInd', 'unemp');
await page.waitForTimeout(300);
await page.mouse.move(640, 500); await page.waitForTimeout(250);
out.push('explorer tooltip visible: ' + await page.locator('#exTip').isVisible() + ' text: ' + (await page.textContent('#exTip')).replace(/\n/g, ' | '));
out.push('explorer table rows: ' + await page.locator('#exTable tbody tr').count());
const dl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
await page.click('#exCsv');
const d = await dl;
out.push('CSV download: ' + (d ? d.suggestedFilename() : 'NONE'));
await go('#/compare');
await page.selectOption('#cmpInd', 'co2');
await page.waitForTimeout(300);
const before = await page.locator('#cmpTable tbody tr:first-child td:first-child').textContent();
await page.locator('#cmpTable th[data-sort], #cmpTable th.sortable').nth(1).click();
await page.waitForTimeout(200);
const after = await page.locator('#cmpTable tbody tr:first-child td:first-child').textContent();
out.push('compare sort first row: ' + before.trim() + ' -> ' + after.trim());
await go('#/rankings');
out.push('rankings rows: ' + await page.locator('#rkList tbody tr').count());
await go('#/country/SGP');
out.push('country SGP table rows: ' + await page.locator('#ctTable tbody tr').count());
await go('#/sources');
out.push('sources indicator blocks: ' + await page.locator('.srcrow').count());
await go('#/country/XXX');
out.push('bad country handled: ' + (await page.textContent('h1')));
out.push('console errors: ' + JSON.stringify(errors));
console.log(out.join('\n'));
await browser.close();
server.close();
