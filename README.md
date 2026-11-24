# 深色横向分页落地页模板

三屏横向翻页的单文件落地页。所有比例锁死在 **1:1.618**，所有面板用**渐变黑**，翻页时**连续模糊**（不是开关式切换）。

只改内容、不改结构，就能套到任何产品上。

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

## 踩过的坑

见 `TEMPLATE.md` §10，12 条，全部按 root cause 记录。最贵的三条：

1. flex 列里 `.wrap` 用 `margin:0 auto` 会塌成内容宽 → 每页看起来像不同模板
2. 用 `zoom` / `scale` 缩小面板 → 字糊，必须重写内部尺寸
3. 删 CSS 块漏一个 `}` → `@media(prefers-reduced-motion)` 的 `*{animation:none}` 泄漏，全站动画静默失效
