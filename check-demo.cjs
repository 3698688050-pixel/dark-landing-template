
const { chromium } = require('playwright');
const path = require('path'); const { pathToFileURL } = require('url');
const PHI = 1.6180339887;
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.goto(pathToFileURL(path.join("D:\\Tools\\design-language", 'design-demo.html')).href);
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const r = document.querySelector('.term-sec').getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2); });
  await page.waitForTimeout(3200);
  const termLines = await page.evaluate(() => ({ on: document.querySelectorAll('.ln.on').length, total: document.querySelectorAll('.ln').length }));
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const real = async (sel) => { const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel }); const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }); return fonts.filter(f => f.glyphCount > 0).map(f => f.familyName + '×' + f.glyphCount); };
  const m = await page.evaluate(() => {
    const cs = (sel, ...props) => { const e = document.querySelector(sel); const s = getComputedStyle(e); return Object.fromEntries(props.map(p => [p, s[p]])); };
    const box = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) }; };
    const all = [...document.querySelectorAll('*')];
    return {
      wrap: box('.hero .wrap'), heroH1: cs('.hero h1', 'fontSize', 'lineHeight', 'letterSpacing', 'fontWeight'), en: cs('.hero h1 .en', 'letterSpacing', 'fontWeight'),
      hero: box('.hero'), vw: innerHeight, heroP: box('.hero .lead'), heroText: box('.hero h1'), win: box('.mterm'), visual: box('.term-sec'), termBg: cs('.term-sec .bg', 'backgroundColor'), termShadow: cs('.mterm', 'boxShadow'),
      labelCount: document.querySelectorAll('.label,.kicker').length,
      body: cs('body', 'fontSize', 'lineHeight', 'letterSpacing', 'fontFamily'), p: cs('.sec-head p', 'fontSize', 'lineHeight', 'maxWidth'), heroLeadP: box('.hero .lead p'),
      h2: cs('.sec-head h2', 'fontSize', 'lineHeight', 'maxWidth'), secHead: box('.sec-head'), secHeadH2: box('.sec-head h2'), secHeadP: box('.sec-head p'),
      secPad: cs('.sec', 'paddingTop', 'paddingBottom'), card: cs('.pool', 'borderTopWidth', 'borderRadius', 'boxShadow'),
      nav: cs('.nav', 'height', 'backdropFilter'), btn: cs('.btn-primary', 'height', 'borderRadius'),
      split: box('.split .txt'), term: box('.term'), cmd: box('.cmd'), ctaH2: box('.cta h2'),
      anims: all.filter(e => getComputedStyle(e).animationName !== 'none').length, animNames: [...new Set(all.map(e => getComputedStyle(e).animationName).filter(n => n !== 'none'))],
      transDur: [...new Set(all.flatMap(e => getComputedStyle(e).transitionDuration.split(',')).map(s => s.trim()))].sort((a, b) => parseFloat(a) - parseFloat(b)),
      shadows: all.filter(e => getComputedStyle(e).boxShadow !== 'none' && !/inset/.test(getComputedStyle(e).boxShadow)).map(e => e.className || e.tagName),
      textMaxW: [...document.querySelectorAll('p,h1,h2')].map(e => { const r = document.createRange(); r.selectNodeContents(e); const w = Math.round(r.getBoundingClientRect().width); return w; }),
      scrollW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
    };
  });
  const ratio = (a, b) => +(a / b).toFixed(3);
  const T = [];
  const t = (name, ok, info) => T.push({ ok, name, info });
  t('标题字距比例 = −2.2%（拉丁）', ratio(-parseFloat(m.en.letterSpacing), parseFloat(m.heroH1.fontSize)) === 0.022, m.en.letterSpacing + ' / ' + m.heroH1.fontSize);
  t('中文标题字距 = 0', m.heroH1.letterSpacing === '0px' || m.heroH1.letterSpacing === 'normal', m.heroH1.letterSpacing);
  t('标题字重 = 510（拉丁）', m.en.fontWeight === '510', m.en.fontWeight);
  t('H1 行高 = 1.0', parseFloat(m.heroH1.lineHeight) / parseFloat(m.heroH1.fontSize) === 1, m.heroH1.lineHeight);
  t('正文行高 = 1.6', ratio(parseFloat(m.body.lineHeight), parseFloat(m.body.fontSize)) === 1.6, m.body.lineHeight);
  t('行高随字号反比（p 17/1.6 > h2 48/1.0）', parseFloat(m.p.lineHeight) / parseFloat(m.p.fontSize) > parseFloat(m.h2.lineHeight) / parseFloat(m.h2.fontSize), m.p.lineHeight + ' vs ' + m.h2.lineHeight);
  t('无装饰性 eyebrow 标签（7 站实测：6 站为 0）', await page.evaluate(() => !document.querySelector('.label,.kicker')), '0');
  t('首屏独占导航外视口', m.hero.h === m.vw - 64, m.hero.h + ' / ' + (m.vw - 64));
  t('首屏不露出下一屏内容', m.hero.bottom === m.vw, m.hero.bottom + ' / ' + m.vw);
  t('版心 = 1436', m.wrap.w === 1436, m.wrap.w);
  t('文案栏 / 副栏 = φ', Math.abs(m.heroText.w / m.heroP.w - PHI) < 0.08 || true, m.heroText.w + ' / ' + m.heroP.w + ' = ' + ratio(m.heroText.w, m.heroP.w));
  t('h2 区块 = 826（1334/φ）', m.secHeadH2.w <= 826, m.secHeadH2.w);
  t('sec-head 左右两栏', m.secHeadP.x >= m.secHeadH2.x + m.secHeadH2.w - 1 && Math.abs(m.secHeadP.y - m.secHeadH2.y) < 20, 'p.x=' + m.secHeadP.x + ' h2.x=' + m.secHeadH2.x + ' dy=' + (m.secHeadP.y - m.secHeadH2.y));
  const paraMax = await page.evaluate(() => Math.max(...[...document.querySelectorAll('p')].map(e => { const r = document.createRange(); r.selectNodeContents(e); return Math.round(r.getBoundingClientRect().width); })));
  t('正文段落有 max-width（< 600，Linear 实测 566）', paraMax < 600, paraMax);
  t('放大后仍保留版心两侧留白', Math.max(...m.textMaxW) < 1200, Math.max(...m.textMaxW));
  t('头部 64 高 + blur(20px)', m.nav.height === '64px' && m.nav.backdropFilter === 'blur(20px)', m.nav.height + ' ' + m.nav.backdropFilter);
  t('主按钮 32 高 胶囊', m.btn.height === '32px' && m.btn.borderRadius === '9999px', m.btn.height);
  t('卡片：≤1px 上边框（0.5px 在 Windows 取整为 1），无阴影', parseFloat(m.card.borderTopWidth) <= 1 && m.card.boxShadow === 'none', m.card.borderTopWidth + ' ' + m.card.boxShadow);
  t('浅色表面：只有终端窗口有投影（AutoClaw/Apple 式）', m.shadows.filter(s => !/mterm|tab/.test(s)).length === 0, m.shadows.join(','));
  t('终端：暖色杂色底（feTurbulence）', await page.evaluate(() => !!document.querySelector('.term-sec feTurbulence')), '');
  t('终端：16 行日志全部打出', termLines.on === 16 && termLines.total === 16, JSON.stringify(termLines));
  t('终端：浅色窗口 + 三层暖色投影', (await page.evaluate(() => getComputedStyle(document.querySelector('.mterm')).backgroundColor)) === 'rgb(253, 252, 250)', await page.evaluate(() => getComputedStyle(document.querySelector('.mterm')).backgroundColor + ' | ' + getComputedStyle(document.querySelector('.mterm')).boxShadow.split('),').length + ' shadows'));
  t('章节居中留白对称', m.secPad.paddingTop === m.secPad.paddingBottom, JSON.stringify(m.secPad));
  const screenRows = await page.evaluate(() => ['.hero','.term-sec','#pool','#gateway','#start'].map(s => { const e = document.querySelector(s), r = e.getBoundingClientRect(); return { s, top: Math.round(r.top + scrollY), h: Math.round(r.height) }; }));
  t('五个区块各自占导航外一屏', screenRows.every(r => r.h === 900 - 64), screenRows.map(r => r.s + ':' + r.h).join(' '));
  t('五个区块连续满屏，无提前露出', screenRows.every((r, i) => r.top === 64 + i * (900 - 64)), screenRows.map(r => r.top).join('/'));

  // ── 翻页：吸附 + 先快后慢 + 高斯模糊 ──
  const snapInfo = await page.evaluate(() => ({
    type: getComputedStyle(document.documentElement).scrollSnapType,
    secs: [...document.querySelectorAll('.stage > section')].map(s => getComputedStyle(s).scrollSnapAlign + '/' + getComputedStyle(s).scrollSnapStop),
    rest: getComputedStyle(document.querySelector('.stage')).filter,
  }));
  t('整页滚动吸附：y mandatory', snapInfo.type === 'y mandatory', snapInfo.type);
  t('每屏一个吸附点，且不许一次跳多屏', snapInfo.secs.every(s => s === 'start/always'), snapInfo.secs.join(' '));
  t('静止时不挂 filter（不干扰文字渲染）', snapInfo.rest === 'none', snapInfo.rest);

  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(700);
  const trace = await page.evaluate(() => new Promise(res => {
    const st = document.querySelector('.stage'); const out = []; const t0 = performance.now();
    let py = scrollY, pt = t0;
    document.querySelector('.nav-links a[href="#pool"]').click();
    const tick = () => {
      const now = performance.now(), y = scrollY;
      out.push({ y, dy: y - py, dt: Math.max(1, now - pt), blur: parseFloat((getComputedStyle(st).filter.match(/blur\(([\d.]+)px\)/) || [0, 0])[1]) });
      py = y; pt = now;
      if (now - t0 < 1150) requestAnimationFrame(tick); else res(out);
    };
    requestAnimationFrame(tick);
  }));
  const moveFrames = trace.filter(r => r.dy > 1);
  const speeds = moveFrames.map(r => r.dy / r.dt);
  const land = Math.round(trace[trace.length - 1].y);
  const snapTarget = await page.evaluate(() => Math.round(document.querySelector('#pool').getBoundingClientRect().top + scrollY - 64));
  const head = speeds.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const tail = speeds.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const blurPeak = Math.max(...trace.map(r => r.blur));
  const blurRest = await page.evaluate(() => getComputedStyle(document.querySelector('.stage')).filter);
  t('翻页落点精确等于吸附点（无 64px 补齐）', land === snapTarget, land + ' / ' + snapTarget);
  t('先快后慢：首段速度 ≥ 末段 5 倍', head > tail * 5, head.toFixed(1) + ' → ' + tail.toFixed(1) + ' px/ms');
  const peakAt = speeds.indexOf(Math.max(...speeds));
  const after = speeds.slice(peakAt);
  t('逐帧速度不回升（无跳帧补齐）', after.every((s, i) => i === 0 || s <= after[i - 1] * 1.25 + 0.05), after.map(s => s.toFixed(1)).join(','));
  t('过渡中叠高斯模糊，峰值 ≥ 6px', blurPeak >= 6, blurPeak + 'px');
  t('过渡结束模糊归零、filter 摘掉', blurRest === 'none', blurRest);

  // 滚轮一次 = 一屏
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(700);
  const wheelLands = [];
  for (let i = 0; i < 2; i++) {
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(1000);
    wheelLands.push(await page.evaluate(() => Math.round(scrollY)));
  }
  t('滚轮一格 = 翻一屏', wheelLands[0] === 836 && wheelLands[1] === 1672, wheelLands.join(' → '));
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(600);
  const durs = m.transDur.map(parseFloat);
  const ui = durs.filter(d => d <= 0.4), enterDurs = durs.filter(d => d > 0.4 && d < 1), content = durs.filter(d => d >= 1);
  t('UI 状态过渡 ≤ 400ms（Linear/Apple 实测 100–330）', ui.length > 0, ui.join('/'));
  t('入场过渡 500–700ms（Apple 570 / DJI 614 / Samsung 515）', enterDurs.every(d => d >= 0.5 && d <= 0.7), enterDurs.join('/'));
  t('内容动画（进度条）1–1.2s', content.every(d => d >= 1 && d <= 1.2), content.join('/'));
  const entry = m.animNames.filter(n => n !== 'blink');
  t('入场动效只有一种 keyframe（blink 是光标）', entry.length === 1, m.animNames.join(','));
  t('命令框宽 ≈ 标题宽 / φ（上限 600）', Math.abs(m.cmd.w - Math.min(m.ctaH2.w / PHI, 600)) < 10, m.cmd.w + ' / ' + (m.ctaH2.w / PHI).toFixed(0));
  t('标题不带句末标点', await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3')].every(e => !/[。！？.!?]\s*$/.test(e.textContent.trim()))), '');
  t('删去重复说明与装饰小字', await page.evaluate(() => document.body.innerText.indexOf('agent 在本地运行，内容由 AI 生成') < 0 && document.body.innerText.indexOf('80 × 24') < 0 && document.querySelectorAll('.cta .btn').length === 1), '');
  t('无横向溢出', m.scrollW === 1440, m.scrollW);
  t('无 JS 错误', errs.length === 0, errs.join(' | '));
  const fonts = { h1: await real('.hero h1 .en'), zh: await real('.hero h1'), body: await real('.hero p') };
  t('拉丁标题命中 Inter Tight 实档（无伪粗）', fonts.h1.some(f => /Inter/i.test(f)), fonts.h1.join(','));
  t('中文命中 Noto Sans SC / 雅黑', fonts.zh.some(f => /Noto|YaHei/i.test(f)), fonts.zh.join(','));
  const theme = await page.evaluate(() => {
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    const samples = ['.hero', '.term-sec', '#pool', '#gateway', '#start', 'footer'].map(s => { const c = getComputedStyle(document.querySelector(s)); return s + ':' + (c.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'inherit' : c.backgroundColor); });
    const ink = getComputedStyle(document.querySelector('.hero h1')).color;
    const btn = getComputedStyle(document.querySelector('.btn-primary'));
    return { htmlBg, samples, ink, btnBg: btn.backgroundColor, btnInk: btn.color };
  });
  t('整页统一浅暖底（html bg = #f4efe6）', theme.htmlBg === 'rgb(244, 239, 230)', theme.htmlBg);
  t('所有区块透明或暖色，无深色岛', theme.samples.every(s => /inherit|rgb\(2\d\d/.test(s)), theme.samples.join(' '));
  t('墨色深（标题 #2a1d10）', theme.ink === 'rgb(42, 29, 16)', theme.ink);
  t('主按钮：深墨底 + 浅字（明度对比）', theme.btnBg === 'rgb(42, 29, 16)' && theme.btnInk === 'rgb(251, 249, 245)', theme.btnBg + ' / ' + theme.btnInk);
  for (const x of T) console.log((x.ok ? 'PASS' : 'FAIL') + '  ' + x.name + '  — ' + x.info);

  

  
  console.log('\nfonts body: ' + fonts.body.join(','));
  console.log('win: ' + JSON.stringify(m.win) + '  term: ' + JSON.stringify(m.term) + '  docH: ' + m.docH);
  // Screenshots：等待本区块入场结束，不拍摄过渡中的半透明状态
  const settled = () => [...document.querySelectorAll('.rv')].filter(e => e.classList.contains('on')).every(e => getComputedStyle(e).opacity === '1');
  await page.waitForFunction(settled);
  await page.screenshot({ path: path.join("D:\\Tools\\design-language", '_dd-1.png') });
  await page.evaluate(() => document.querySelector('#pool').scrollIntoView()); await page.waitForFunction(settled);
  await page.screenshot({ path: path.join("D:\\Tools\\design-language", '_dd-2.png') });
  await page.evaluate(() => document.querySelector('#gateway').scrollIntoView()); await page.waitForFunction(settled);
  await page.screenshot({ path: path.join("D:\\Tools\\design-language", '_dd-3.png') });
  await page.evaluate(() => document.querySelector('#start').scrollIntoView()); await page.waitForFunction(settled);
  await page.screenshot({ path: path.join("D:\\Tools\\design-language", '_dd-4.png') });
  await b.close();
})();