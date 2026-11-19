const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
const FONT = fs.readFileSync(__dirname + '/fonts.css', 'utf8');
const OUT = __dirname + '/shots/'; fs.mkdirSync(OUT, { recursive: true });
const meta = {};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const font = async (ctx) => ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.request().url().includes('css') ? r.fulfill({ contentType: 'text/css', body: FONT }) : r.abort());
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.5, reducedMotion: 'reduce' });
  await font(ctx);
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  // English UI
  await p.addInitScript(() => { try { localStorage.setItem('sapatm3:state', JSON.stringify({ lang: 'en', members: null, who: 1, tab: 'today', loc: { region: 'R08', prov: 'Leyte', city: null, market: null }, prices: {}, budget: null, preset: 1, halal: false, example: true, day: null })); } catch (e) {} });
  await p.goto('http://localhost:5500/family-app/index.html');
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + 'welcome1.png' });
  await p.click('#wSkip'); await p.waitForTimeout(500);
  const tall = async (name) => {
    await p.evaluate(() => document.getElementById('main').scrollTop = 0);
    const g = await p.evaluate(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(); return { mainTop: r('main').top, navTop: r('nav').top }; });
    await p.screenshot({ path: OUT + name + '-view.png' });
    await p.addStyleTag({ content: '.stage,.phone,.screen{height:auto!important;min-height:0!important} main#main{overflow:visible!important;flex:none!important} nav.bottom,.homebar{display:none!important} .toast{display:none!important}' }).then(h => p.evaluate(() => {}));
    await p.waitForTimeout(200);
    const el = await p.$('#main'); const bb = await el.boundingBox();
    await el.screenshot({ path: OUT + name + '-tall.png' });
    meta[name] = { ...g, tallH: bb.height };
    await p.evaluate(() => { const s = [...document.querySelectorAll('style')].pop(); s.remove(); });
    await p.waitForTimeout(200);
  };
  for (const t of ['week', 'shop', 'today', 'family']) {
    await p.click(`#nav button[data-t="${t}"]`); await p.waitForTimeout(600);
    await tall(t);
  }
  // sheets
  await p.click('#nav button[data-t="shop"]'); await p.waitForTimeout(500);
  const calc = await p.$('#v-shop .calc'); await calc.scrollIntoViewIfNeeded(); await calc.click(); await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + 'shop-calc.png' });
  await p.evaluate(() => closeSheet()); await p.waitForTimeout(300);
  await p.click('#nav button[data-t="today"]'); await p.waitForTimeout(500);
  const oth = await p.$('#v-today [data-other]'); if (oth) { await oth.scrollIntoViewIfNeeded(); await oth.click(); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'today-other.png' }); await p.evaluate(() => closeSheet()); }
  await p.click('#nav button[data-t="family"]'); await p.waitForTimeout(500);
  await p.click('#v-family [data-who="1"]'); await p.waitForTimeout(600);
  await tall('person');
  // Tagalog versions of the four tabs (viewport only) for authenticity shots
  await p.evaluate(() => setLang('tl')); await p.waitForTimeout(300);
  for (const t of ['today', 'week']) { await p.click(`#nav button[data-t="${t}"]`); await p.waitForTimeout(500); await p.evaluate(() => document.getElementById('main').scrollTop = 0); await p.screenshot({ path: OUT + t + '-tl.png' }); }

  // LGU dashboard
  const lg = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.2, reducedMotion: 'reduce' }); await font(lg);
  const q = await lg.newPage(); q.on('pageerror', e => console.log('ERR lgu', e.message));
  await q.goto('http://localhost:5500/lgu-dashboard/index.html'); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(1500);
  await q.screenshot({ path: OUT + 'lgu-map.png' });
  await q.getByRole('button', { name: 'Alert level' }).click(); await q.waitForTimeout(800);
  await q.getByRole('button', { name: 'Rice spike 2023' }).click(); await q.waitForTimeout(1500);
  await q.screenshot({ path: OUT + 'lgu-rice2023.png' });
  await q.getByRole('button', { name: 'Poorest 10% can afford' }).click().catch(() => {}); await q.waitForTimeout(800);
  await q.screenshot({ path: OUT + 'lgu-afford.png' });
  await q.click('#tab-menu'); await q.waitForTimeout(1500);
  await q.screenshot({ path: OUT + 'lgu-menu.png' });
  await q.screenshot({ path: OUT + 'lgu-menu-full.png', fullPage: true });
  fs.writeFileSync(OUT + 'meta.json', JSON.stringify(meta, null, 1));
  console.log(meta);
  await b.close();
})();
