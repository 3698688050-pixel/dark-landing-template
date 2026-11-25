# 深色横向分页落地页模板

三屏横向翻页的单文件落地页。所有比例锁死在 **1:1.618**，所有面板用**渐变黑**，翻页时**连续模糊**（不是开关式切换）。

只改内容、不改结构，就能套到任何产品上。

- **v1** — 首版：TEMPLATE.md 复刻文档 + 单文件成品 + DOM 验收脚本
- **v2** — 渲染层优化：打字机、翻页 paint、面板 fit、鼠标视差四处重写，**像素级零差异**（见下文「v2 改了什么」）

## 快速开始

```bash
npm i                      # 只装 playwright，用于验收
npx playwright install chromium
```

双击 `landing.html` 就能看。改完跑一次验收：

```bash
node check.cjs
```

全绿（无 AssertionError）才算改对。

## 文件

| 文件 | 作用 |
|---|---|
| `TEMPLATE.md` | **主文档**：流程 + token + HTML 骨架 + 10 个 CSS 模块 + 2 个 JS 模块 + 验收脚本 + 踩坑表 |
| `landing.html` | 成品，单文件（CSS / HTML / JS 全在里面） |
| `check.cjs` | DOM 断言脚本：页数、每页宽度、溢出、白线、渐变、三个 1.618 比例、JS 报错 |
| `mkdoc.cjs` | 从 `landing.html` 重新生成 `TEMPLATE.md`，保证文档代码与源码逐字节一致 |
| `DESIGN-LANGUAGE.md` | 设计语言原始规范（色板、字阶、间距） |
| `vendor/fonts/` | 自托管字体：Inter Tight（仅拉丁）+ JetBrains Mono |

## 结构

```
header
main.deck            ← flex 横排，每屏 flex:0 0 100%，scroll-snap
  section.hero       ← 标题 + 终端（逐字敲 Python）
  section#product    ← 左文案 + 右产品面板（随鼠标 3D 倾斜）
  section#start      ← CTA + 命令框
.deck-nav + .dots
```

每页共用两条伪元素规则，不要每页手写 div：

- `section::after` → 底部 1px 白线
- `section::before` → 冷暖径向叠光

## 改内容

看 `TEMPLATE.md` §9 的对照表。核心原则：

- 改文案 → 只动 `h1` / `.lead` / `.body`
- 改终端代码 → 只动 JS 里的 `raw` 数组，行数 ≤ 12
- 改产品面板行 → `.acct` 块保持 9 行
- **不要动** `.wrap` 的宽度规则、`--panel-grad`、三个 1.618 的 calc

改完 `node check.cjs`，再 `node mkdoc.cjs` 更新文档。

---

## v2 改了什么

目标：**效果一个像素都不变，只让浏览器少干活**。四处改动，全部在 `landing.html` 的 `<script>` 和两行 CSS 里。

### 1. 打字机：不再每帧重建整个 `<pre>`

原版每打一个字就 `el.innerHTML = draw(i) + caret`——整段 HTML 重新解析，`<pre>` 下 35 个节点全部重建。

现在按 token 建好节点，每帧只改「正在打的那个 token」的 `textContent`，打完的节点不再碰：

| | v1 | v2 |
|---|---|---|
| 2.2 秒内 DOM 变动 | 162 次（每次重建整个 `<pre>`） | 32 次（每次只动一个 ≤20 字符的节点） |

两个细节是为了像素一致：无色 token 用裸文本节点、相邻无色段先合并——这样产出的 DOM 和原来 innerHTML 解析结果完全一致（35 个子节点，一个不差），字形渲染路径才相同。

### 2. 翻页 `paint()`：只写变化的属性

原来每帧对 3 页无条件写 3 个 style（`filter / opacity / transform`），值没变也写。现在值不变就不碰，静止时零样式失效。完全离开视口的页直接 `filter:none; opacity:0`，不再各占一个 blur 合成层。scroll 事件一帧来多次也只留一次 rAF。

| | v1 | v2 |
|---|---|---|
| 静止时每帧 style 写入 | 9 | 0 |
| 离屏页占 blur 合成层 | 2 | 0 |

### 3. 面板 `fit()`：加了「是本页才算」的闸

原来每个 scroll 事件都 `setTimeout(fit, 180)`，从第 1 页滚到第 3 页也要给第 2 页的面板算一遍。现在防抖回调里先查 `is-active`，只在本页时算。翻页落定后精修一次的行为保留。

### 4. 鼠标视差：rAF 合并

原来每个 `mousemove` 事件同步写一次 transform，一帧最多 N 次。现在一帧只写一次。

### 没动的

翻页 tween 期间 `blur(16px)` 滤镜的合成开销——这是连续模糊效果本身，改了就不模糊。两个版本 tween 期间都是 0 次强制同步布局，这块本来就是干净的。

---

## 怎么验证「效果没变」

不要用肉眼看，也不要只跑 `check.cjs`——它只断言布局数值，不比像素。做法：

1. 优化前先备份（本仓库的 `landing.pre-opt.html` 不入库，只在本地）
2. 两版用同一个 viewport（1440×900）、同一个时刻（打字机跑完）、同一个光标相位（`animation:none; opacity:1` 冻住）各截一张
3. 逐像素比，阈值 8（滤掉 PNG 编码噪声），要求 **diff = 0**

光标是 `blink` 动画，不冻结的话两次截图差 1 帧，像素差直接飙到 15 万——第一次比时被这个骗过。

---

## 踩过的坑

见 `TEMPLATE.md` §10，12 条，全部按 root cause 记录。最贵的四条：

1. flex 列里 `.wrap` 用 `margin:0 auto` 会塌成内容宽 → 每页看起来像不同模板
2. 用 `zoom` / `scale` 缩小面板 → 字糊，必须重写内部尺寸
3. 删 CSS 块漏一个 `}` → `@media(prefers-reduced-motion)` 的 `*{animation:none}` 泄漏，全站动画静默失效
4. **给终端加 `contain:paint` / `contain:strict`** → 元素成为合成边界，内部文字的抗锯齿路径随之改变，边缘像素差 1 级灰度。肉眼不可见，但像素对比过不了。用二分法在基线上逐条加 CSS 才定位到。结论：**要像素一致，`contain` 只用 `layout`，不用 `paint`**

另一个 v2 的教训：无头 Chromium 里 rAF 帧间隔测量（dropped frames）噪声太大，两版各跑一次差 10 帧，同一文件跑两次也差这么多——**不能用帧率证明优化**。改用 MutationObserver 数 DOM 变动、数 style 写入、数强制同步布局，这些是确定性的。
