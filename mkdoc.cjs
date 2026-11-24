const fs = require('fs')
const SRC = 'D:/Tools/design-language/landing.html'
const OUT = 'D:/Tools/design-language/TEMPLATE.md'
const s = fs.readFileSync(SRC, 'utf8')

const css = s.slice(s.indexOf('<style>') + 7, s.indexOf('</style>')).trim()
const bodyHtml = s.slice(s.indexOf('<body>') + 6, s.indexOf('<script>')).trim()
const js = s.slice(s.indexOf('<script>') + 8, s.indexOf('</script>')).trim()

// CSS 按分节注释切块
const cssParts = []
let cur = { name: '基础：字体 / token / reset', code: [] }
css.split('\n').forEach(l => {
  const m = l.trim().match(/^\/\* ── (.+?) [─\s]*\*\/?$/)
  if (m) {
    if (cur.code.join('').trim()) cssParts.push(cur)
    cur = { name: m[1].replace(/[─\s]+$/, ''), code: [] }
  } else cur.code.push(l)
})
if (cur.code.join('').trim()) cssParts.push(cur)

// JS 按 IIFE 切块
const jsParts = js.split(/\n(?=\(\(\) => \{)/).map(t => t.trim()).filter(Boolean)
const jsNames = ['打字机：终端逐字敲出代码', '横向分页 + 连续模糊 + 面板 3D 倾斜']

const wrap = (t, lang = 'css') => '```' + lang + '\n' + t.trim() + '\n```'

const head = `# 深色横向分页落地页 · 复刻模板

> 目标：**只改内容，不改结构**。照这份文档从零做出来的站，和 \`landing.html\` 像素级一致。
> 所有数值都是实测出来的，不是估的。不要"优化"，照着抄。

---

## 0. 这份文档怎么用

| 你想干的事 | 看哪一节 |
|---|---|
| 从零做一遍 | §2 流程 → §5 骨架 → §6 CSS → §7 JS |
| 换文案 / 换产品 | §9 换内容对照表 |
| 出问题了 | §10 踩坑表（全是真实踩过的） |
| 改完验一遍 | §8 验收脚本 |

铁律三条：

1. **不要用截图验收**。所有断言走 DOM 数值（§8），截图只给人看。
2. **不要用 \`zoom\` / \`transform:scale\` 缩小内容**。字会糊、布局会塌，必须重写内部尺寸。
3. **每改一次跑一次 \`node check.cjs\`**。这个项目 80% 的返工都是"改 A 崩 B"。

---

## 1. 成品是什么

三屏横向翻页，一屏一页，竖向滚轮即翻页：

| 页 | id | 内容 | 关键组件 |
|---|---|---|---|
| 1 | （无） | Hero：标题 + 说明 + 终端 | 终端面板 693×517，逐字敲 Python，macOS 红黄绿三点 |
| 2 | \`#product\` | 左文案 + 右产品面板 | 面板 809×714，随鼠标 3D 倾斜，9 行账号带红黄绿延迟 |
| 3 | \`#start\` | 收尾 CTA | 标题 + 说明两行 + 命令框（宽 = 标题宽 / 1.618） |

全站共用：

- 深色渐变底 \`#08090a\` + 每页一层冷暖径向叠光
- 每页底部一条 1px 白线（\`rgba(255,255,255,.05)\`）
- 翻页时**连续**模糊：离屏幕中心越远越糊（不是开关式切换）
- 所有面板用**渐变黑**，不是纯色
- 没有页脚、没有免责声明、没有小灰字

---

## 2. 流程（按顺序，别跳）

1. **定 token**（§6.1）。颜色只允许：一个 accent、ok / warn / err 三个状态色、四级墨色。
2. **搭骨架**（§5）：\`header\` + \`.deck\`（3 个 \`section\`）+ \`.deck-nav\` + \`.dots\`。
3. **先只做第一页的静态版**。做完立刻量 DOM：\`wrap\` 宽度必须等于版心宽（1436），不能是内容宽。
4. **给每页套同一个 band 规则**（§6.8）：\`width:100%\` + \`min-height:min(560px,62vh)\` + \`justify-content:space-between\`。这一步决定"每页看起来是不是同一个模板"。
5. **画每页的底白线和渐变背景**：都用 \`section::after\` / \`section::before\`，不要每页手写 div。
6. **做翻页**（§7.2）：deck 用 flex + scroll-snap 做骨架，翻页动作自己写 rAF tween（原生 smooth 时长不可调）。
7. **做模糊**（§7.2 的 \`paint()\`）：每帧按"离中心距离"写 inline \`filter/opacity/transform\`，不要用 class 切换。
8. **做面板**：渐变黑 token → 内部尺寸重写（不用 scale）→ 3D 倾斜 → \`fit()\` 迭代收高度。
9. **做打字机**（§7.1）：把源码切成 \`[文本, 类名]\` 段，逐字渲染 HTML。
10. **跑 §8 验收**，全绿再交付。
11. 以后改了 \`landing.html\`，跑一次 \`node mkdoc.cjs\`，本文档的代码块会从源文件重新抽取，永远和线上一致。

---

## 3. 设计 token（照抄，别新增颜色）

| token | 值 | 用途 |
|---|---|---|
| \`--bg\` | \`#08090a\` | 页面底色 |
| \`--ink\` | \`#f7f8f8\` | 主文字 |
| \`--ink-2\` | \`#b9bcc2\` | 次级文字 |
| \`--ink-3\` | \`#62666d\` | 说明 / 代码灰 |
| \`--accent\` | \`#8fa6ff\` | 唯一强调色（蓝） |
| \`--ok\` | \`#5ecc87\` | 绿：可用 |
| \`--warn\` | \`#f2a33c\` | 黄：限流 |
| \`--err\` | \`#f0716f\` | 红：封禁 |
| \`--panel-grad\` | \`linear-gradient(180deg,#171819 0%,#111214 34%,#0a0b0c 68%,#08090a 100%)\` | **所有面板** |
| \`--hdr\` | \`64px\` | 顶栏高 |
| \`--gut\` | \`max(46px, (100vw - 1436px)/2)\` | 版心边距 |

字：\`ITight\`（自托管 Inter Tight，仅拉丁，中文回落系统）+ \`JBM\`（JetBrains Mono）。

比例约定：

- 版心 \`max-width:1436px\`
- 图文分栏 \`1 : 1.618\`（金比），或 Linear 式 \`42 : 58\`
- 命令框宽 = 标题宽 \`/ 1.618\`
- 面板高 = \`(100vh - 64px) / 1.618\`（第一页终端）

---

## 4. 文件结构

\`\`\`
design-language/
├─ landing.html            # 单文件：CSS + HTML + JS 全在里面
├─ check.cjs               # 断言脚本（§8）
├─ mkdoc.cjs               # 从 landing.html 重新生成本文档
├─ vendor/fonts/
│   ├─ intertight-var.woff2
│   ├─ jbmono-400.woff2
│   └─ jbmono-500.woff2
└─ TEMPLATE.md             # 本文件
\`\`\`

单文件是刻意的：没有构建、没有依赖、\`file://\` 直接开。

---

## 5. HTML 骨架

\`\`\`html
${bodyHtml}
\`\`\`

---

## 6. CSS 模块

> 下面 ${cssParts.length} 块拼起来就是完整的 \`<style>\`，顺序不能变（后面的规则依赖前面的 token）。

`

let md = head
cssParts.forEach((p, i) => {
  md += `### 6.${i + 1} ${p.name}\n\n${wrap(p.code.join('\n'))}\n\n`
})

md += `---

## 7. JS 模块

> 两个 IIFE 按顺序放在同一个 \`<script>\` 里。都必须在 \`DOMContentLoaded\` 之后执行（脚本放 body 末尾即可）。

`
jsParts.forEach((p, i) => {
  md += `### 7.${i + 1} ${jsNames[i] || '脚本'}\n\n${wrap(p, 'js')}\n\n`
})

md += `---

## 8. 验收脚本（check.cjs）

每次改完跑 \`node check.cjs\`，全部 \`true\` 才算过。断言项：

\`\`\`js
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
\`\`\`

---

## 9. 换内容对照表

| 想改什么 | 改哪里 | 不要动 |
|---|---|---|
| 标题 / 说明文案 | §5 骨架里的 \`h1\` / \`.lead\` / \`.body\` | \`.wrap\` 的宽度规则 |
| 终端里的代码 | §7.1 的 \`raw\` 数组 | \`segs\` 切分逻辑、\`draw()\` |
| 终端代码的行数 | 控制在 12 行内（面板固定 15 行高） | \`height:calc((100vh - var(--hdr))/1.618)\` |
| 产品面板里的行 | §5 里的 \`.acct\` 块，**必须保持 9 行** | \`.shot-body\` 的 \`grid-template-rows\` |
| 状态颜色 | \`.st[data-tone="ok|warn|err"]\` | 三个色值 |
| 页数 | \`.deck\` 里增删 \`section\`，同步改 \`.dots\` 与 nav 链接 | \`slides\` 是自动取的，不用改 JS |
| 主色 | \`--accent\` | 其余状态色 |

换内容后必须重跑 §8，重点是 \`widths\`（每页 wrap 宽度一致）、\`fits\`（溢出）和三个比例值。

> \`bands\` 只校验 ≤90%。第 2 页的面板是故意撑到白线的（84%），所以三页 band 不一致是正常的；
> 只要 \`widths\` 一致、\`fits\` 为 true，就说明用的是同一个模板。

---

## 10. 踩坑表（全部真实踩过，按 root cause 记）

| 症状 | 真正原因 | 修法 |
|---|---|---|
| 每页看起来像不同模板 | flex 列里的 \`.wrap\` 用了 \`margin:0 auto\`，宽度塌成内容宽 | \`.deck > section > .wrap{width:100%}\` |
| 缩小面板后字全糊 | 用 \`zoom\` / \`transform:scale\` 缩小整块 | 重写内部字号/行高，不用缩放 |
| 全站动画突然全没了 | 删 CSS 块时漏掉一个 \`}\`，\`@media(prefers-reduced-motion)\` 里的 \`*{animation:none!important}\` 泄漏到全局 | 删块后立刻数括号，跑 §8 |
| 翻页时长改不了 | 原生 \`scrollTo({behavior:'smooth'})\` 固定约 450ms | 自己写 rAF tween（\`DUR=1000\`），期间临时 \`scroll-snap-type:none\` |
| 两页之间是"硬切"不是渐变 | 用 class 切模糊 | 每帧按离中心距离写 inline filter（\`paint()\`） |
| 3D 倾斜后量出来的行重叠/超高 | \`getBoundingClientRect\` 是投影后的包围盒 | 量布局用 \`offsetTop / offsetHeight\` |
| 面板固定高度后行被裁掉 | 行压到 \`min-height\` 后仍溢出，被 \`overflow:hidden\` 切掉 | 面板高度由内容撑开 + \`fit()\` 迭代（投影会压缩，一次算不准） |
| KPI 压住第一行 | \`.kpis\` 作为 flex item 被 shrink | \`.kpis{flex:none}\` |
| 打字机 20 秒打不完 | 字数 × 46ms 远超循环周期 | 缩短文本、调 \`ms/字\`，或干脆去掉循环 |
| 面板想"再大一点"但被比例卡死 | 1:1.618 + 画幅 1440 ⇒ 面板宽上限 = 版心 / 2.618 ≈ 809 | 只能二选一：放宽比例或缩小左栏 |
| 每页底部白线对不齐 | 每页各写一条 div | 统一用 \`section::after\` + 同一个 \`left/right\` 公式 |
| 面板/终端发灰没有"黑得发亮" | 用了纯色 \`--surface\` | 一律 \`--panel-grad\` 渐变黑 |

---

## 11. 一句话总结

> 三屏横向分页 + 每帧连续模糊 + 渐变黑面板 + 统一 band 规则 + 全部比例锁死在 1:1.618。
> 换内容只动 §9 表里那几处，别动骨架和数值。
`

fs.writeFileSync(OUT, md)
console.log('写入', OUT)
console.log('大小', (md.length / 1024).toFixed(1), 'KB  行数', md.split('\n').length)
console.log('CSS 模块', cssParts.length, 'JS 模块', jsParts.length)
