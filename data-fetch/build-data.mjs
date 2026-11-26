import { readFileSync, writeFileSync } from 'node:fs';
const countries = { IDN:'Indonesia', MYS:'Malaysia', PHL:'Philippines', SGP:'Singapore', THA:'Thailand', VNM:'Vietnam' };
const indicators = [
 ['SP.POP.TOTL','Population','people'],
 ['NY.GDP.MKTP.CD','GDP','USD current'],
 ['NY.GDP.PCAP.CD','GDP per capita','USD current'],
 ['SP.DYN.LE00.IN','Life expectancy','years'],
 ['SL.UEM.TOTL.ZS','Unemployment','% of labour force'],
 ['FP.CPI.TOTL.ZG','Inflation','% annual'],
 ['SI.POV.NAHC','Poverty headcount','% of population'],
 ['SE.ADT.LITR.ZS','Adult literacy','% ages 15+'],
];
const out = { meta:{ source:'World Bank Open Data (WDI)', fetched:'2026-11-26', years:[2014,2024], countries, indicators: Object.fromEntries(indicators.map(([c,n,u])=>[c,{name:n,unit:u}])) }, values:{} };
for (const [code] of indicators) {
  const d = JSON.parse(readFileSync(code+'.json','utf8'));
  const rows = d[1] || [];
  out.values[code] = {};
  for (const r of rows) {
    const c = r.countryiso3code, y = +r.date;
    if (!out.values[code][c]) out.values[code][c] = {};
    out.values[code][c][y] = r.value === null ? null : Math.round(r.value*100)/100;
  }
}
writeFileSync('../app-data.json', JSON.stringify(out));
console.log('bytes', JSON.stringify(out).length);
// coverage report
for (const [code,name] of indicators) {
  const line = Object.keys(countries).map(c=>{
    const ys = Object.keys(out.values[code][c]||{}).filter(y=>out.values[code][c][y]!==null);
    return c+':'+(ys.length? Math.min(...ys)+'-'+Math.max(...ys)+'('+ys.length+')':'none');
  }).join(' ');
  console.log(code, name, '\n  ', line);
}
