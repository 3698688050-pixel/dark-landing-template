const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = __dirname;
const markdown = fs.readFileSync(path.join(root, 'VERTICAL-SCROLL.md'), 'utf8');

function extract(name) {
  const heading = `### \`${name}\``;
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `Missing module section: ${name}`);
  const fence = markdown.indexOf('```', start + heading.length);
  assert.notEqual(fence, -1, `Missing opening code fence: ${name}`);
  const languageEnd = markdown.indexOf('\n', fence + 3);
  const end = markdown.indexOf('\n```', languageEnd + 1);
  assert.notEqual(end, -1, `Missing code fence: ${name}`);
  return markdown.slice(languageEnd + 1, end);
}

(async () => {
  const files = {
    'index.html': extract('index.html'),
    'scroll.css': extract('scroll.css'),
    'scroll-effects.js': extract('scroll-effects.js'),
    'scroll-pager.js': extract('scroll-pager.js'),
  };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'design-language-scroll-'));
  let browser;
  try {
    for (const [name, contents] of Object.entries(files)) {
      fs.writeFileSync(path.join(temp, name), contents, 'utf8');
    }
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(pathToFileURL(path.join(temp, 'index.html')).href);
    await page.waitForFunction(() => typeof createScrollEffects === 'function' && typeof createScrollPager === 'function');

    const navHeight = await page.locator('.demo-nav').evaluate(el => el.offsetHeight);
    assert.equal(navHeight, 64);
    const atPage = y => page.waitForFunction(y => scrollY === y &&
      getComputedStyle(document.documentElement).scrollSnapType === 'y mandatory' &&
      !document.querySelector('.stage').style.filter, y, { timeout: 5000 });
    await page.locator('a[href="#demo"]').click();
    await page.waitForFunction(() => Boolean(document.querySelector('.stage').style.filter), undefined, { timeout: 5000 });
    await atPage(836);
    assert.equal(await page.locator('.glow').evaluate(el =>
      new DOMMatrixReadOnly(getComputedStyle(el).transform).m42), -418);
    await page.keyboard.press('PageUp');
    await atPage(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('a[href="#next"]').click();
    await atPage(1672);
    assert.equal(await page.locator('.glow').evaluate(el => getComputedStyle(el).display), 'none');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('a[href="#demo"]').click();
    await atPage(836);
    const inner = page.locator('[data-scroll-inner]');
    await inner.hover();
    await inner.evaluate(el => { el.scrollTop = 24; });
    const scrollTop = await inner.evaluate(el => el.scrollTop);
    await page.mouse.wheel(0, -60);
    await page.waitForFunction(previous => document.querySelector('[data-scroll-inner]').scrollTop < previous, scrollTop, { timeout: 2000 });
    assert.equal(await page.evaluate(() => scrollY), 836);
    await inner.evaluate(el => { el.scrollTop = 0; });
    await page.mouse.wheel(0, -60);
    await atPage(0);
    const disposed = await page.evaluate(() => {
      document.querySelector('[href="#demo"]').click();
      window.removeEventListener('scroll', onScroll);
      effects.destroy();
      pager.destroy();
      const wheel = new WheelEvent('wheel', { deltaY: 80, cancelable: true });
      window.dispatchEvent(wheel);
      return { prevented: wheel.defaultPrevented, snap: getComputedStyle(document.documentElement).scrollSnapType };
    });
    assert.deepEqual(disposed, { prevented: false, snap: 'y mandatory' });
    assert.deepEqual(errors, []);
    console.log('PASS Markdown modules load from file://');
    console.log('PASS anchor and keyboard paging, speed blur, glow parallax, and reduced motion');
    console.log('PASS nested scrolling, page turn at the scroll boundary, and cleanup');
  } finally {
    await browser?.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
