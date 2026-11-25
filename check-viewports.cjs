const { chromium } = require('playwright');
const path = require('path'); const { pathToFileURL } = require('url');
const dir = __dirname;
const VPS = [[1920, 1080, 'fhd'], [1440, 900, 'wide'], [1280, 720, 'hd'], [1024, 800, 'tab'], [390, 844, 'mob']];
(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const [w, h, tag] of VPS) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto(pathToFileURL(path.join(dir, 'design-demo.html')).href);
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const secs = ['.hero', '.term-sec', '#pool', '#gateway', '#start'].map(s => {
        const e = document.querySelector(s);
        const b = e.getBoundingClientRect();
        // content bounds inside the section
        const kids = [...e.querySelectorAll(':scope > .wrap > *')];
        let minTop = Infinity, maxBot = -Infinity;
        for (const k of kids) { const kb = k.getBoundingClientRect(); if (kb.height) { minTop = Math.min(minTop, kb.top - b.top); maxBot = Math.max(maxBot, kb.bottom - b.top); } }
        return { s, h: Math.round(b.height), contentH: Math.round(maxBot - minTop), clipped: maxBot > b.height + 1 || minTop < -1 };
      });
      return { vh: innerHeight, overflowX: document.documentElement.scrollWidth > innerWidth, secs, docH: document.documentElement.scrollHeight };
    });
    out.push({ tag, w, h, ...r, errs: errs.length });
    await page.screenshot({ path: path.join(dir, `_vp-${tag}-1.png`) });
    if (tag === 'mob' || tag === 'hd') {
      for (const [i, s] of ['.term-sec', '#pool', '#gateway', '#start'].entries()) {
        await page.evaluate(s => { const e = document.querySelector(s); scrollTo({ top: e.getBoundingClientRect().top + scrollY - 64, behavior: 'instant' }); }, s);
        await page.waitForTimeout(i === 0 ? 3000 : 1100);
        await page.screenshot({ path: path.join(dir, `_vp-${tag}-${i + 2}.png`) });
      }
    }
    await page.close();
  }
  for (const o of out) console.log(`${o.tag} ${o.w}x${o.h} overflowX=${o.overflowX} docH=${o.docH} errs=${o.errs} | ` + o.secs.map(s => `${s.s}:${s.h}${s.clipped ? ' CLIP' : ''}`).join(' '));
  await browser.close();
  if (out.some(o => o.overflowX || o.errs || o.secs.some(s => s.clipped))) process.exitCode = 1;
})();
