import { chromium } from '/home/hatch/.npm-global/lib/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('app/', import.meta.url));
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json' };
const server = createServer(async (req,res)=>{ const p=decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/^\/+/,'')||'index.html'; try{ const b=await readFile(join(root,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);}catch{res.writeHead(404);res.end();} });
await new Promise(r=>server.listen(8124,'127.0.0.1',r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{width:1280,height:800} });
const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
// sources view
await page.goto('http://127.0.0.1:8124/#/sources',{waitUntil:'networkidle'});
console.log('sources h1:', await page.textContent('h1'), '| rows:', await page.locator('table.data tbody tr').count());
// explorer: switch indicator to unemployment, hover chart
await page.goto('http://127.0.0.1:8124/#/explorer',{waitUntil:'networkidle'});
await page.selectOption('#indSelect','SL.UEM.TOTL.ZS');
await page.waitForTimeout(300);
await page.mouse.move(700,450); await page.waitForTimeout(200);
console.log('tooltip visible:', await page.locator('#exTip').isVisible(), '| text:', (await page.textContent('#exTip')).replace(/\n/g,' | '));
// compare: click "Latest value" header twice to sort ascending, check first row
await page.goto('http://127.0.0.1:8124/#/compare',{waitUntil:'networkidle'});
await page.selectOption('#cmpSelect','NY.GDP.PCAP.CD');
await page.waitForTimeout(300);
const firstBefore = await page.locator('#cmpTable tbody tr:first-child td:first-child').textContent();
await page.locator('#cmpTable th[data-sort="value"]').click(); await page.waitForTimeout(200);
const firstAfter = await page.locator('#cmpTable tbody tr:first-child td:first-child').textContent();
console.log('compare first row before sort:', firstBefore, '-> after click:', firstAfter);
console.log('console errors:', JSON.stringify(errors));
await browser.close(); server.close();
