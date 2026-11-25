# 深色横向分页落地页模板

三屏横向翻页的单文件落地页。所有比例锁死在 **1:1.618**，所有面板用**渐变黑**，翻页时**连续模糊**（不是开关式切换）。

只改内容、不改结构，就能套到任何产品上。

- **v1** — 首版：TEMPLATE.md 复刻文档 + 单文件成品 + DOM 验收脚本
- **v2** — 渲染层优化：打字机、翻页 paint、面板 fit、鼠标视差四处重写，**像素级零差异**（见下文「v2 改了什么」）
- **v3** — 新增 `design-demo.html`：竖屏满屏翻页的第二套成品。九站实测得到的排版与动效参数 + 滚一下就翻一页（先快后慢 + 速度驱动的髙斯模糊）
- **v3.5** — 优化竖向翻页的滚动采样和滤镜更新，附上[可复制的 CSS、JS 模块和接线示例](VERTICAL-SCROLL.md)。

## 两个成品

| 文件 | 形态 | 适合 |
|---|---|---|
| `landing.html` | 横向翻页，深色，翻页时连续模糊 | 产品发布页（Linear 式） |
| `design-demo.html` | 竖向满屏吸附，浅暖色，带噪点终端 | 演示 / 说明页（AutoClaw 式） |

两套都是单文件、离线可开、字体自托管。`design-demo.html` 的全部设计决策都有实测出处，见 `DESIGN-LANGUAGE.md` 第二、三部分。

## 快速开始

```bash
npm i                      # 只装 playwright，用于验收
npx playwright install chromium
```

双击 `landing.html` 或 `design-demo.html` 即可预览。从仓库根目录运行相应验收。

```bash
node check.cjs                 # 横向成品
node check-demo.cjs            # 竖向成品
node check-viewports.cjs       # 竖向成品的五档视口
node check-scroll-modules.cjs  # 从 Markdown 提取并运行复用示例
```

`check-demo.cjs` 的中文字体断言需要系统安装 Noto Sans SC 或微软雅黑。

## 文件

| 文件 | 作用 |
|---|---|
| `TEMPLATE.md` | **主文档**：流程 + token + HTML 骨架 + 10 个 CSS 模块 + 2 个 JS 模块 + 验收脚本 + 踩坑表 |
| `landing.html` | 成品，单文件（CSS / HTML / JS 全在里面） |
| `check.cjs` | DOM 断言脚本：页数、每页宽度、溢出、白线、渐变、三个 1.618 比例、JS 报错 |
| `design-demo.html` | 第二套成品：竖向满屏吸附 + 速度驱动模糊（v3.5） |
| [VERTICAL-SCROLL.md](VERTICAL-SCROLL.md) | 竖向翻页的最小示例、CSS 吸附层和两个可独立接入的 JS 模块 |
| `check-scroll-modules.cjs` | 从 Markdown 提取代码，检查离线运行和翻页交互 |
| `check-demo.cjs` | `design-demo.html` 的 49 条断言：字号/字距/黄金比/配色/翻页曲线/模糊衰减 |
| `check-viewports.cjs` | 五档视口（1920/1440/1280/1024/390）逐屏溢出与裁切检测 |
| `hero-study.html` | 噪点背景研究稿：`design-demo.html` 底纹与终端窗口的来源 |
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

## v3.5 竖向翻页性能优化

- 背景视差和速度模糊共用一个 `requestAnimationFrame`，每帧只采样一次 `scrollY`。
- 模糊半径变化时直接写 `.stage` 的 `filter`，缩小样式重算范围。两次非零写入至少间隔 45ms，静止时移除 `filter` 和 `will-change`。
- 程序翻页直接维护当前页。拖滚动条和触控滚动结束后再检查各屏的位置。滚轮和键盘只检查命令块能否内滚，不再逐级读取祖先节点的样式。

在无头 Chromium 的 1440×900 视口中，从首屏跳到账号池，两版各跑三次。下表为每项指标的三次结果中位数。帧间隔仅供参考，不代表真机帧率。

| 指标 | v3 | v3.5 |
|---|---:|---:|
| 翻页及收尾期间的样式重算耗时 | 16.0ms | 5.3ms |
| 720ms 翻页窗口内的平均帧间隔 | 42.3ms | 41.4ms |

桌面 1440×900 和移动端 390×844 各对比五屏。冻结入场和光标动画后，10 组静止截图逐像素一致。另有 49 项行为与版式断言、五档视口检查。

完整接线和四段可直接保存的代码见 [竖向翻页复用指南](VERTICAL-SCROLL.md)。

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

---

## v3 改了什么

新增 `design-demo.html`——第二套成品，竖向满屏翻页。两件事：

1. **把九站实测变成一套可用的参数**（字体、字号、行高、字距、入场曲线、什么在动、什么不该出现）
2. **把「滚一下就翻一页」做对**：吸附 + 自定义缓动 + 速度驱动的髙斯模糊

完整数据与推导见 `DESIGN-LANGUAGE.md` 第二、三部分。这里只留结论和踩过的坑。

### 1. 每节独占一屏

```css
html{ scroll-snap-type: y mandatory; }
section{
  min-height: calc(100svh - 64px);   /* svh：手机上地址栏收起时不跳 */
  scroll-snap-align: start;
  scroll-snap-stop: always;          /* 快速甩动也只走一屏 */
  scroll-margin-top: 64px;           /* 顶部导航高度，不给就被盖住 */
}
```

五节（首屏 / 终端 / 账号池 / 网关 / 接入）各自恰好一屏，五档视口实测无溢出、无裁切、无提前露出。放大是整体等比：字号 68→80，终端 980→1100，分栏 826:508 与字距未动。

### 2. 先快后慢：easeOutQuart，720ms

浏览器自带的吸附动画不给自定义缓动，所以滚轮要 `preventDefault` + 逐帧 `scrollTo`。实测逐帧速度：

```
8.6 → 7.8 → 6.7 → 5.5 → 3.8 → 2.7 → 1.8 → 1.1 → 0.7 → 0.4 → 0.2 → 0.1 → 0.0  (px/ms)
```

试过 `easeOutExpo`，它在 340ms 就走完 96%，剩下 380ms 只挪 4%，看起来像「卡住了然后抖一下」。指数曲线适合瞬时反馈，不适合一整屏位移。

### 3. 髙斯模糊：由速度推导

```js
vy = dy < 3 ? vy * 0.5 : vy + (dy / dt - vy) * 0.5;
const radius = Math.round(Math.min(8, vy * 1.1) * 2) / 2;
```

v3.5 保留速度映射和量化参数。写入及清理见 [滚动视觉模块](VERTICAL-SCROLL.md#js-滚动视觉)。

实测 `8 → 7.5 → 6 → 4.5 → 3.5 → 2.5 → 1.5 → 1 → 0.5 → 0`。因为读的是真实滚动位移，滚轮、触控板、拖滚动条、键盘、锚点跳转自动获得同一套模糊。

三条硬约束：

- **静止时完全不挂 `filter`**。`blur(0px)` 也会让元素成为滤镜层，改变文字次像素抗锯齿。
- **半径变化限频**。两次非零写入至少间隔 45ms，位移仍随帧更新。
- **小于 3px 的位移只衰减历史速度**，避免收尾吸附修正让画面「已经清晰了又糊一下」。

### 4. 三个坑（都表现为「动画最后抖一下」）

1. **`offsetTop` 在 `position:relative` 父级下会变**。给内容容器加定位（为了 footer）后，子元素 `offsetTop` 从「相对文档」变成「相对容器」，动画目标整体偏 64px，结束时吸附再补回来——就是那一下回弹。改用 `getBoundingClientRect().top + scrollY`。
2. **rAF 回调的时间戳滞后于真实时间**。这一帧因重栅格化推迟时，`now` 比 `performance.now()` 早几十毫秒，动画比预期晚结束，最后一帧一次性补齐 66px。进度改用 `performance.now()`。
3. **两轮动画互抢 `scrollY`**。翻页途中再点一个导航项，旧循环每帧覆盖新循环。加递增令牌，循环里先比对。

### 5. 验收

`check-demo.cjs` 共 **49 条断言**，全部 PASS。关键几条都是数值而非肉眼：

```
翻页落点精确等于吸附点（无 64px 补齐）   →  1672 / 1672
先快后慢：首段速度 ≥ 末段 5 倍            →  7.7 → 0.1 px/ms
逐帧速度不回升（无跳帧补齐）              →  8.6,7.8,6.7,…,0.1,0.0
过渡中叠髙斯模糊，峰值 ≥ 6px              →  8px
过渡结束模糊归零、filter 摘掉             →  none
滚轮一格 = 翻一屏                         →  836 → 1672
静止时不挂 filter（不干扰文字渲染）        →  none
```

另外三个设计结论也进了断言：「无装饰性 eyebrow 标签」（7 站实测 6 站为 0）、「标题不带句末标点」、「整页统一浅暖底，无深色岛」。

### 6. v3 的设计取舍

- **一个页面只能有一套颜色系统**。第一版是 Linear 的深色 token + AutoClaw 的暖色噪点终端，单看每块都对，合起来像两个网站拼接。噪点需要亮底才看得见，所以整站改成浅暖 `#f4efe6`。
- **中文标题不能用 `ch` 单位**。`ch` 是数字 `0` 的宽度，一个汉字占 1.8 个 `ch`，`13ch` 等于「7 个字就换行」，标题会被从词中间劈开。踩了两次。
- **黄金比例只用在 4 个结构点**：首屏高度、两处分栏（826:508 与镜像）、命令框宽 = 标题宽/φ。字号阶 16→26→42→68 是 ×1.618，但不往每个间距上洒。
