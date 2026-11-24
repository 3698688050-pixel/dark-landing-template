const { chromium } = require('playwright')
const assert = require('assert')
const path = require('path')
const { pathToFileURL } = require('url')

;(async () => {
  const b = await chromium.launch()
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))
  await page.goto(pathToFileURL(path.join(__dirname, 'landing.html')).href)
  await page.waitForTimeout(14000)   // 等打字机跑完

  const r = await page.evaluate(() => {
    const deck = document.getElementById('deck')
    const slides = [...deck.children].filter(e => /^(SECTION|FOOTER)$/.test(e.tagName))
    const band = s => {
      const k = [...s.children]
      const t = Math.min(...k.map(x => x.offsetTop))
      const b2 = Math.max(...k.map(x => x.offsetTop + x.offsetHeight))
      return (b2 - t) / s.offsetHeight
    }
    return {
      pages: slides.length,
      widths: slides.map(s => Math.round(s.querySelector('.wrap').offsetWidth)),
      bands: slides.map(s => Math.round(band(s) * 100)),
      fits: slides.every(s => s.scrollHeight - s.clientHeight <= 2),
      lines: slides.map(s => getComputedStyle(s, '::after').borderTopWidth),
      grads: slides.every(s => getComputedStyle(s, '::before').backgroundImage !== 'none'),
      noHScroll: document.documentElement.scrollWidth <= innerWidth,
      termRatio: +(deck.clientHeight / document.querySelector('.term').offsetHeight).toFixed(3),
      panelRatio: +(document.querySelector('.shot').offsetWidth /
                    document.querySelector('.shot-copy').offsetWidth).toFixed(3),
      cmdRatio: +(document.querySelector('.close h2').offsetWidth /
                  document.querySelector('.cmd').offsetWidth).toFixed(3),
    }
  })

  assert.strictEqual(r.pages, 3, '页数必须是 3')
  assert.ok(r.widths.every(w => w === r.widths[0]), '每页 wrap 宽度必须一致（不能塌成内容宽）')
  assert.ok(r.bands.every(v => v <= 90), '内容不能顶到白线以外')
  assert.ok(r.fits, '每页内容不能溢出')
  assert.ok(r.lines.every(w => w === '1px'), '每页底部白线必须存在')
  assert.ok(r.grads, '每页必须有渐变叠光')
  assert.ok(r.noHScroll, '不能有横向滚动')
  assert.ok(Math.abs(r.termRatio - 1.618) < 0.01, '终端高 = 内容区高 / 1.618')
  assert.ok(Math.abs(r.panelRatio - 1.618) < 0.01, '面板宽 = 左栏宽 × 1.618')
  assert.ok(Math.abs(r.cmdRatio - 1.618) < 0.01, '标题宽 = 命令框宽 × 1.618')
  assert.deepStrictEqual(errs, [], '不能有 JS 报错')

  console.log('全部通过', r)
  await b.close()
})()
