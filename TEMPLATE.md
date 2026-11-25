# 深色横向分页落地页 · 复刻模板

> 目标：**只改内容，不改结构**。照这份文档从零做出来的站，和 `landing.html` 像素级一致。
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
2. **不要用 `zoom` / `transform:scale` 缩小内容**。字会糊、布局会塌，必须重写内部尺寸。
3. **每改一次跑一次 `node check.cjs`**。这个项目 80% 的返工都是"改 A 崩 B"。

---

## 1. 成品是什么

三屏横向翻页，一屏一页，竖向滚轮即翻页：

| 页 | id | 内容 | 关键组件 |
|---|---|---|---|
| 1 | （无） | Hero：标题 + 说明 + 终端 | 终端面板 693×517，逐字敲 Python，macOS 红黄绿三点 |
| 2 | `#product` | 左文案 + 右产品面板 | 面板 809×714，随鼠标 3D 倾斜，9 行账号带红黄绿延迟 |
| 3 | `#start` | 收尾 CTA | 标题 + 说明两行 + 命令框（宽 = 标题宽 / 1.618） |

全站共用：

- 深色渐变底 `#08090a` + 每页一层冷暖径向叠光
- 每页底部一条 1px 白线（`rgba(255,255,255,.05)`）
- 翻页时**连续**模糊：离屏幕中心越远越糊（不是开关式切换）
- 所有面板用**渐变黑**，不是纯色
- 没有页脚、没有免责声明、没有小灰字

---

## 2. 流程（按顺序，别跳）

1. **定 token**（§6.1）。颜色只允许：一个 accent、ok / warn / err 三个状态色、四级墨色。
2. **搭骨架**（§5）：`header` + `.deck`（3 个 `section`）+ `.deck-nav` + `.dots`。
3. **先只做第一页的静态版**。做完立刻量 DOM：`wrap` 宽度必须等于版心宽（1436），不能是内容宽。
4. **给每页套同一个 band 规则**（§6.8）：`width:100%` + `min-height:min(560px,62vh)` + `justify-content:space-between`。这一步决定"每页看起来是不是同一个模板"。
5. **画每页的底白线和渐变背景**：都用 `section::after` / `section::before`，不要每页手写 div。
6. **做翻页**（§7.2）：deck 用 flex + scroll-snap 做骨架，翻页动作自己写 rAF tween（原生 smooth 时长不可调）。
7. **做模糊**（§7.2 的 `paint()`）：每帧按"离中心距离"写 inline `filter/opacity/transform`，不要用 class 切换。
8. **做面板**：渐变黑 token → 内部尺寸重写（不用 scale）→ 3D 倾斜 → `fit()` 迭代收高度。
9. **做打字机**（§7.1）：把源码切成 `[文本, 类名]` 段，逐字渲染 HTML。
10. **跑 §8 验收**，全绿再交付。
11. 以后改了 `landing.html`，跑一次 `node mkdoc.cjs`，本文档的代码块会从源文件重新抽取，永远和线上一致。

---

## 3. 设计 token（照抄，别新增颜色）

| token | 值 | 用途 |
|---|---|---|
| `--bg` | `#08090a` | 页面底色 |
| `--ink` | `#f7f8f8` | 主文字 |
| `--ink-2` | `#b9bcc2` | 次级文字 |
| `--ink-3` | `#62666d` | 说明 / 代码灰 |
| `--accent` | `#8fa6ff` | 唯一强调色（蓝） |
| `--ok` | `#5ecc87` | 绿：可用 |
| `--warn` | `#f2a33c` | 黄：限流 |
| `--err` | `#f0716f` | 红：封禁 |
| `--panel-grad` | `linear-gradient(180deg,#171819 0%,#111214 34%,#0a0b0c 68%,#08090a 100%)` | **所有面板** |
| `--hdr` | `64px` | 顶栏高 |
| `--gut` | `max(46px, (100vw - 1436px)/2)` | 版心边距 |

字：`ITight`（自托管 Inter Tight，仅拉丁，中文回落系统）+ `JBM`（JetBrains Mono）。

比例约定：

- 版心 `max-width:1436px`
- 图文分栏 `1 : 1.618`（金比），或 Linear 式 `42 : 58`
- 命令框宽 = 标题宽 `/ 1.618`
- 面板高 = `(100vh - 64px) / 1.618`（第一页终端）

---

## 4. 文件结构

```
design-language/
├─ landing.html            # 单文件：CSS + HTML + JS 全在里面
├─ check.cjs               # 断言脚本（§8）
├─ mkdoc.cjs               # 从 landing.html 重新生成本文档
├─ vendor/fonts/
│   ├─ intertight-var.woff2
│   ├─ jbmono-400.woff2
│   └─ jbmono-500.woff2
└─ TEMPLATE.md             # 本文件
```

单文件是刻意的：没有构建、没有依赖、`file://` 直接开。

---

## 5. HTML 骨架

```html
<header class="hd">
  <div class="wrap hd-in">
    <a class="brand" href="#">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5H5v14h4"/><path d="M15 5h4v14h-4"/><path d="M12 9.5v5"/></svg>
      WorkBuddy2API
    </a>
    <nav class="nav">
      <a href="#product">产品</a>
      <a href="#start">部署</a>
    </nav>
    <div class="hd-right">
      <a class="hd-star" href="https://github.com/linguo2625469/workbuddy2api-panel">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a7.75 7.75 0 0 0-2.45 15.1c.39.07.53-.17.53-.37v-1.3c-2.16.47-2.62-1.04-2.62-1.04-.35-.9-.86-1.14-.86-1.14-.7-.48.05-.47.05-.47.78.06 1.19.8 1.19.8.69 1.18 1.81.84 2.25.64.07-.5.27-.84.49-1.03-1.72-.2-3.54-.86-3.54-3.84 0-.85.3-1.54.8-2.09-.08-.2-.35-.99.08-2.06 0 0 .66-.21 2.15.8a7.4 7.4 0 0 1 3.92 0c1.49-1.01 2.15-.8 2.15-.8.43 1.07.16 1.86.08 2.06.5.55.8 1.24.8 2.09 0 2.99-1.82 3.64-3.55 3.83.28.24.53.71.53 1.44v2.13c0 .2.14.45.54.37A7.75 7.75 0 0 0 8 .25"/></svg>
        <span>Star</span>
      </a>
      <a class="btn btn-primary btn-sm" href="#start">开始部署</a>
    </div>
  </div>
</header>

<main class="deck" id="deck">

<!-- Hero -->
<section class="hero">
  <div class="wrap">
    <div class="hero-g">
      <div class="hero-copy">
        <h1>把 CodeBuddy 账号<br>变成 <em>OpenAI</em> 接口</h1>
        <p class="lead">多账号池、熔断冷却、会话粘性都由网关处理。对客户端只暴露一个接口，现有 SDK 零改造接入。</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#start">开始部署</a>
          <a class="btn btn-ghost" href="#product">看账号池面板
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </div>

      <div class="term" aria-label="请求示例">
        <div class="term-hd">
          <span class="lights" aria-hidden="true"><i></i><i></i><i></i></span>
        </div>
        <div class="term-body">
<pre><span class="out" id="stream"></span></pre>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 产品窗口 -->
<section class="sec shot-sec" id="product">
  <div class="wrap shot-g">
    <div class="shot-copy">
      <h2>每个数字都能追到链路里的某一环</h2>
      <p class="body">面板不做抽象统计。账号为什么掉出池、积分什么时候到期、哪个模型被限流，都在同一屏里，且都带着时间。</p>
      <ul class="shot-list">
        <li><b>9</b> 个账号：6 可用 · 2 限流 · 1 封禁，带倒计时</li>
        <li><b>412s</b> 最长冷却剩余，到点自动回池</li>
        <li><b>02:41</b> 后签到回血，解冻 402 的账号</li>
      </ul>
    </div>
    <div class="shot-stage">
    <div class="shot" aria-hidden="true">
      <div class="shot-hd">
        <span class="t">终端</span>
      </div>
      <div class="shot-body">
        <div class="shot-nav">
          <div class="it on">账号池</div>
          <div class="it">用量</div>
          <div class="it">积分构成</div>
          <div class="it">任务中心</div>
          <div class="it">模型与档位</div>
          <div class="it">配置</div>
          <div class="it">运行日志</div>
        </div>
        <div class="shot-main">
          <div class="kpis">
            <div class="kpi"><div class="lab">账号总数</div><div class="val">9</div></div>
            <div class="kpi"><div class="lab">可用</div><div class="val">6</div></div>
            <div class="kpi"><div class="lab">冷却中</div><div class="val">3</div></div>
            <div class="kpi"><div class="lab">积分剩余</div><div class="val">1.8<em>万</em></div></div>
          </div>
          <div class="acct">
            <span class="av">01</span><span class="nm">workbuddy-a1</span>
            <span class="bar"><i style="width:78%"></i></span>
            <span class="cr">3,240</span>
            <span class="st" data-tone="ok">312ms</span>
          </div>
          <div class="acct">
            <span class="av">02</span><span class="nm">workbuddy-a2</span>
            <span class="bar"><i style="width:46%"></i></span>
            <span class="cr">1,905</span>
            <span class="st" data-tone="ok">368ms</span>
          </div>
          <div class="acct" data-tone="warn">
            <span class="av">03</span><span class="nm">workbuddy-a3</span>
            <span class="bar"><i style="width:22%"></i></span>
            <span class="cr">870</span>
            <span class="st" data-tone="cool">412s</span>
          </div>
          <div class="acct">
            <span class="av">04</span><span class="nm">workbuddy-a4</span>
            <span class="bar"><i style="width:64%"></i></span>
            <span class="cr">2,610</span>
            <span class="st" data-tone="ok">295ms</span>
          </div>
          <div class="acct">
            <span class="av">05</span><span class="nm">workbuddy-b1</span>
            <span class="bar"><i style="width:35%"></i></span>
            <span class="cr">1,420</span>
            <span class="st" data-tone="ok">430ms</span>
          </div>
          <div class="acct bad">
            <span class="av">06</span><span class="nm">workbuddy-b2</span>
            <span class="bar"><i style="width:9%"></i></span>
            <span class="cr">330</span>
            <span class="st" data-tone="err">3h</span>
          </div>
          <div class="acct">
            <span class="av">07</span><span class="nm">workbuddy-b3</span>
            <span class="bar"><i style="width:52%"></i></span>
            <span class="cr">1,180</span>
            <span class="st" data-tone="ok">341ms</span>
          </div>
          <div class="acct" data-tone="warn">
            <span class="av">08</span><span class="nm">workbuddy-c1</span>
            <span class="bar"><i style="width:18%"></i></span>
            <span class="cr">640</span>
            <span class="st" data-tone="cool">88s</span>
          </div>
          <div class="acct">
            <span class="av">09</span><span class="nm">workbuddy-c2</span>
            <span class="bar"><i style="width:71%"></i></span>
            <span class="cr">2,050</span>
            <span class="st" data-tone="ok">388ms</span>
          </div>
          <div class="credits"><span class="dot" style="color:var(--ok)"></span>签到回血 <b>02:41</b> 后执行 · 最近一次熔断 14:52</div>
        </div>
      </div>
    </div>
    </div>
  </div>
</section>

<!-- 收尾 -->
<section class="close" id="start">
  <div class="wrap close-in">
    <h2>两条命令，一个本地接口</h2>
    <div class="right">
      <p class="body">首次启动自动生成配置与随机密钥。打开面板添加账号，浏览器里完成 OAuth，凭证落盘后热加载进池，不用重启。</p>
      <div class="cmd"><b>$</b><span>docker compose up -d --build</span></div>
    </div>
  </div>
</section>
</main>

<div class="deck-nav">
  <button id="deckPrev" type="button" aria-label="上一页">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
  </button>
  <button id="deckNext" type="button" aria-label="下一页">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
  </button>
</div>
<div class="dots" id="dots"></div>
```

---

## 6. CSS 模块

> 下面 10 块拼起来就是完整的 `<style>`，顺序不能变（后面的规则依赖前面的 token）。

### 6.1 基础：字体 / token / reset

```css
@font-face{font-family:"JBM";src:url("vendor/fonts/jbmono-400.woff2") format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"JBM";src:url("vendor/fonts/jbmono-500.woff2") format("woff2");font-weight:500;font-display:swap}
/* 拉丁部分改用 Inter Tight（自托管，可变字重）；汉字仍走系统字 */
@font-face{font-family:"ITight";src:url("vendor/fonts/intertight-var.woff2") format("woff2");font-weight:300 700;font-display:swap;unicode-range:U+0000-00FF,U+2000-206F,U+2100-214F,U+2190-21FF,U+2200-22FF}

:root{
  /* 表面：三级亮度 8 / 15 / 22 */
  --bg:#08090a; --surface:#0f1011; --surface-2:#161718;
  --line:rgba(255,255,255,.08); --line-2:rgba(255,255,255,.12); --line-3:rgba(255,255,255,.05);
  /* 所有深色面板统一用这层渐变黑，底部溶入页面底色 */
  --panel-grad:linear-gradient(180deg,#171819 0%,#111214 34%,#0a0b0c 68%,#08090a 100%);
  /* 文字：四级灰 */
  --ink:#f7f8f8; --ink-2:#8a8f98; --ink-3:#62666d;
  /* 唯一强调色 */
  --accent:#8fa6ff;
  --ok:#5ecc87; --warn:#f2a33c; --err:#f0716f;
  --btn:#e5e5e6; --btn-ink:#08090a;

  --r-sm:6px; --r-md:8px; --r-lg:11px; --r-pill:9999px;
  --hdr:64px;
  /* 容器：1436 + 46 侧边距（Linear 实测），宽屏自动加 gutter */
  --gut:max(46px, calc((100vw - 1436px) / 2));
  /* ITight 自带拉丁，汉字回落到系统 CJK 字体 */
  --sans:"ITight",-apple-system,"PingFang SC","Noto Sans SC","Hiragino Sans GB","Microsoft YaHei UI","Microsoft YaHei",system-ui,sans-serif;
  --mono:"JBM",ui-monospace,"Cascadia Mono",Consolas,monospace;
}

*{box-sizing:border-box}
body{
  margin:0;background:var(--bg);color:var(--ink);
  font:400 15px/26px var(--sans);
  letter-spacing:0;
  -webkit-font-smoothing:antialiased;
  font-synthesis:none;             /* 雅黑没有 500，禁止伪粗体 */
  overflow-x:hidden;
}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
::selection{background:rgba(143,166,255,.28)}
:focus-visible{outline:2px solid rgba(143,166,255,.55);outline-offset:3px;border-radius:2px}
```

### 6.2 排版

```css
h1,h2,h3,p{margin:0}
h1{font-size:clamp(42px,5.1vw,68px);line-height:1.1;font-weight:600;letter-spacing:-.021em}
h2{font-size:clamp(30px,3.15vw,44px);line-height:1.18;font-weight:600;letter-spacing:0;text-wrap:balance}
h3{font-size:16.5px;line-height:24px;font-weight:600;letter-spacing:0}
.lead{font-size:19px;line-height:32px;color:var(--ink-2);max-width:26em;text-wrap:pretty}
.body{font-size:15px;line-height:26px;color:var(--ink-2);max-width:24em;text-wrap:pretty}
.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
```

### 6.3 容器与栅格：12 列，列间距 0（Linear 实测）

```css
.wrap{max-width:1436px;margin:0 auto;padding:0 var(--gut)}
.g12{display:grid;grid-template-columns:repeat(12,minmax(0,1fr))}
.sec{padding:128px 0}
.sec + .sec{border-top:1px solid var(--line-3)}
/* 章节头：标题左、副文右，同一水平线 */
.sec-head{
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:64px;align-items:start;padding-bottom:72px;
}
.sec-head h2{max-width:20em}
.sec-head p{padding-top:6px}
```

### 6.4 顶栏

```css
.hd{
  position:fixed;top:0;left:0;right:0;z-index:50;height:var(--hdr);
  background:rgba(8,9,10,.72);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid var(--line-3);
}
.hd-in{height:100%;display:flex;align-items:center;gap:40px}
.brand{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:500;white-space:nowrap}
.brand svg{width:18px;height:18px;flex:none;fill:none;stroke:var(--ink);stroke-width:1.5;
  stroke-linecap:round;stroke-linejoin:round}
.nav{display:flex;align-items:center;gap:28px}
.nav a{font-size:13.5px;color:var(--ink-2);transition:color .15s ease}
.nav a:hover{color:var(--ink)}
.hd-right{margin-left:auto;display:flex;align-items:center;gap:14px}
.hd-star{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-2);
  font-family:var(--mono);transition:color .15s ease}
.hd-star:hover{color:var(--ink)}
.hd-star svg{width:14px;height:14px;fill:currentColor}
```

### 6.5 按钮：只有一个主按钮，层次靠明度

```css
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  height:40px;padding:0 20px;border-radius:var(--r-pill);
  font-size:14px;white-space:nowrap;
  transition:background .16s ease,border-color .16s ease,color .16s ease;
}
.btn-primary{background:var(--btn);color:var(--btn-ink);font-weight:500}
.btn-primary:hover{background:#fff}
.btn-ghost{border:1px solid var(--line-2);color:var(--ink)}
.btn-ghost:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.2)}
.btn-sm{height:32px;padding:0 14px;font-size:13px}
.btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.6;
  stroke-linecap:round;stroke-linejoin:round}
```

### 6.6 Hero：两栏，左对齐（全站没有居中文本）

```css
.hero{padding:104px 0 0}
.hero-g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);
  gap:48px;align-items:end}
.hero-copy h1{max-width:24em}
/* 汉字不收字距：负字距只给拉丁 */
.hero-copy h1{letter-spacing:0}
.hero-copy .lead{margin-top:26px;font-size:19px;line-height:32px}
.lead em{font-style:normal;color:var(--ink)}
/* 绿线压到下一层：em 自己建层叠上下文，伪元素 z-index:-1 落在字形后面 */
h1 em{font-style:normal;color:inherit;position:relative;z-index:0;white-space:nowrap}
h1 em::after{content:"";position:absolute;z-index:-1;left:-.06em;right:-.06em;
  bottom:.02em;height:.085em;background:var(--ok);opacity:.9}
.hero-cta{display:flex;align-items:center;gap:12px;margin-top:34px}

/* 终端：hero 右栏。不是装饰，是产品的第一次演示 */
.term{
  background:var(--panel-grad);
  border:1px solid var(--line-3);border-radius:var(--r-lg);
  overflow:hidden;
  /* 面板高 : 页面高 = 1 : 1.618，高度写死，打字时不再动 */
  display:flex;flex-direction:column;
  height:calc((100vh - var(--hdr)) / 1.618);
  /* 只隔离布局，不加 paint：paint 会让内部文字切流渲染路径，抗锯齿会变 */
  contain:layout;
}
.term-hd{
  display:flex;align-items:center;gap:10px;height:52px;padding:0 18px;
  border-bottom:1px solid var(--line-3);
}
/* macOS 红黄绿 */
.term-hd .lights{display:flex;gap:8px;margin-right:6px}
.term-hd .lights i{width:11px;height:11px;border-radius:50%;display:block}
.term-hd .lights i:nth-child(1){background:#ff5f57}
.term-hd .lights i:nth-child(2){background:#febc2e}
.term-hd .lights i:nth-child(3){background:#28c840}
.dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex:none}
.term-body{padding:26px 22px 30px;font:400 15px/28px var(--mono);color:var(--ink-2);
  flex:1;overflow:hidden;contain:layout}
.term-body pre{margin:0;font:inherit;white-space:pre;overflow:hidden}
.term-body .req{color:var(--ink-3)}
.term-body .k{color:#8fa6ff}
.term-body .s{color:#9ad4a8}
.term-body .n{color:#e0c08a}
.term-body .out{color:var(--ink);white-space:pre-wrap}
.caret{display:inline-block;width:8px;height:16px;background:var(--accent);
  vertical-align:-3px;animation:blink 1.05s steps(1) infinite;will-change:opacity}
@keyframes blink{50%{opacity:0}}

/* 开屏：整块淡入 + 去模糊（不裁切、不位移，布局比例始终固定） */
@keyframes fadeIn{
  from{opacity:0;filter:blur(16px)}
  to{opacity:1;filter:blur(0)}
}
.hero .wrap{animation:fadeIn 1.8s cubic-bezier(.16,1,.3,1) both}

/* 技术栈行已删除，仅保留底部白线（由 .deck > section::after 统一绘制） */
```

### 6.7 产品窗口：左文右图（Linear 的图文分栏 42/58）

```css
.shot-sec{padding-bottom:128px}
.shot-g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.618fr);
  gap:36px;align-items:center}
.shot-copy h2{max-width:15em}
.shot-copy .body{margin-top:22px;max-width:25em}
.shot-list{list-style:none;margin:32px 0 0;padding:0;display:flex;flex-direction:column;gap:14px}
.shot-list li{position:relative;padding-left:18px;font-size:13.5px;line-height:22px;color:var(--ink-2)}
.shot-list li::before{content:"";position:absolute;left:0;top:9px;width:5px;height:5px;
  border-radius:50%;background:rgba(255,255,255,.22)}
.shot-list b{font:400 13.5px/1 var(--mono);color:var(--ink);margin-right:4px;
  font-variant-numeric:tabular-nums}
/* 面板尺寸：内容按 ~60% 的比例重设（不靠 zoom/scale，文字才不糊） */
.shot-stage{width:100%;min-width:0}
.shot{
  width:100%;
  display:flex;flex-direction:column;
  background:var(--panel-grad);border:1px solid var(--line);border-radius:var(--r-lg);
  overflow:hidden;
  transform-style:preserve-3d;backface-visibility:hidden;
  transition:transform .22s cubic-bezier(.16,1,.3,1);
  will-change:transform;
  contain:layout paint;
}
.shot-hd{display:flex;align-items:center;gap:12px;height:34px;padding:0 12px;
  border-bottom:1px solid var(--line-3)}
.shot-hd .t{font-size:14px;line-height:1;color:var(--ink)}
.shot-body{display:grid;grid-template-columns:128px minmax(0,1fr);grid-template-rows:minmax(0,1fr);flex:1;min-height:0}
.shot-nav{padding:10px 8px;border-right:1px solid var(--line-3);
  display:flex;flex-direction:column;gap:1px}
.shot-nav .it{font-size:11px;line-height:17px;color:var(--ink-3);padding:4px 7px;border-radius:5px}
.shot-nav .it.on{background:rgba(255,255,255,.045);color:var(--ink)}
.shot-main{padding:14px 15px;display:flex;flex-direction:column;min-height:0;overflow:hidden;contain:layout paint}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line-3);
  flex:none;
  border:1px solid var(--line-3);border-radius:6px;overflow:hidden;margin-bottom:14px}
.kpi{background:rgba(255,255,255,.018);padding:9px 10px}
.kpi .lab{font-size:10px;color:var(--ink-3);line-height:13px}
.kpi .val{font:400 15px/19px var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}
.kpi .val em{font-style:normal;font-size:9.5px;color:var(--ink-3);margin-left:2px}
.acct{display:flex;align-items:center;gap:9px;padding:8px 2px;border-top:1px solid var(--line-3);
  position:relative;border-radius:4px;transition:background .16s ease;flex:1 1 auto;min-height:34px}
.acct:first-of-type{border-top:0}
.acct .av{width:18px;height:18px;flex:none;border-radius:50%;background:var(--surface-2);
  border:1px solid var(--line);display:grid;place-items:center;
  font:500 9px/1 var(--mono);color:var(--ink-2)}
.acct .nm{font-size:13px;color:var(--ink);width:104px;flex:none}
.acct .bar{flex:1;height:2px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden}
.acct .bar i{display:block;height:100%;background:rgba(255,255,255,.42)}
.acct .cr{font:400 10.5px/1 var(--mono);color:var(--ink-2);width:56px;text-align:right;flex:none;
  font-variant-numeric:tabular-nums}
.acct .st{display:flex;align-items:center;justify-content:flex-end;width:66px;flex:none;
  font:500 13px/1 var(--sans);font-variant-numeric:tabular-nums;letter-spacing:.02em;
  color:var(--ink-3);transition:filter .16s ease}
.acct .st[data-tone="ok"]{color:var(--ok)}
.acct .st[data-tone="cool"]{color:var(--warn)}
.acct .st[data-tone="err"]{color:var(--err)}
/* 悬停：整行微亮 + 浮起一张线路状态卡（只用红/黄/绿） */
.acct:hover{background:rgba(255,255,255,.035)}
.acct:hover .st{filter:brightness(1.25)}
.shot-nav .it{transition:background .16s ease,color .16s ease}
.shot-nav .it:hover{background:rgba(255,255,255,.035);color:var(--ink-2)}
.acct .av{background:var(--surface);border:1px solid var(--line)}
/* 暂停 / 封禁的账号：整行降级，数字也跟着变冷 */
.acct.wait{border-left:2px solid rgba(239,68,68,.55);padding-left:10px;margin-left:-1px}
.acct.wait .nm,.acct.wait .cr,.acct.wait .av{color:var(--ink-2)}
.acct.wait .bar i{background:rgba(239,68,68,.4)}
.acct[data-tone="warn"]{border-left:2px solid rgba(245,181,68,.5);padding-left:10px;margin-left:-1px}
.acct[data-tone="warn"] .bar i{background:rgba(245,181,68,.45)}
.shot-main .credits{margin-top:10px;padding-top:9px;border-top:1px solid var(--line-3);flex:none;
  display:flex;align-items:center;gap:6px;font:400 10px/1 var(--mono);color:var(--ink-3)}
.shot-main .credits b{font-weight:400;color:var(--ink-2)}
```

### 6.8 收尾 CTA

```css
.close{--close-h2:clamp(36px,4.1vw,56px);padding:128px 0 140px}
.close-in{display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:24px;text-align:center;min-height:min(560px,62vh)}
.close h2{max-width:16em;font-size:var(--close-h2);line-height:1.12}
.close .right{display:flex;flex-direction:column;align-items:center;max-width:38em;padding-bottom:4px}
.close .right p{margin-bottom:26px;max-width:min(470px,100%)}
.cmd{display:flex;align-items:center;gap:10px;margin-top:26px;
  /* 宽度 = 标题宽 / 1.618（标题文字宽正好 11em） */
  width:calc(var(--close-h2) * 6.8);max-width:100%;
  background:var(--panel-grad);border:1px solid rgba(255,255,255,.14);
  border-radius:var(--r-md);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10), 0 0 28px -6px rgba(143,166,255,.38);
  padding:12px 14px;font:400 12.5px/18px var(--mono);color:var(--ink-2);overflow:auto}
.cmd b{color:var(--ink-3);font-weight:400;user-select:none}
```

### 6.9 窄屏

```css
@media (max-width:1180px){
  .hero-g{grid-template-columns:1fr;gap:48px}
  .hero-copy h1{max-width:22ch}
  .term{max-width:640px}
  .term-body pre{white-space:pre-wrap}
  .sec-head{grid-template-columns:1fr;gap:24px;padding-bottom:56px}
  .sec-head h2{max-width:24ch}
  .close-in{gap:28px}
  .shot-g{grid-template-columns:1fr;gap:40px}
  .shot-body{grid-template-columns:1fr}
  .shot-nav{display:none}
}
@media (max-width:820px){
  :root{--gut:24px}
  .nav{display:none}
  .hd-star span{display:none}
  .sec{padding:80px 0}
  .hero{padding-top:64px}
  .hero-copy .lead{font-size:17px;line-height:28px}
  .term-body{font-size:12px;line-height:21px}
  .kpis{grid-template-columns:repeat(2,1fr)}
  .acct .nm{width:auto;flex:1}
  .acct .bar,.acct .cr{display:none}
  .close{padding:80px 0 96px}
}
```

### 6.10 横向分页：一屏一页，模糊随距离连续变化（Apple 式）

```css
.deck{height:calc(100vh - var(--hdr));margin-top:var(--hdr);
  display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;
  scrollbar-width:none;-webkit-overflow-scrolling:touch}
.deck::-webkit-scrollbar{display:none}
/* 每页同一套竖向节奏：内容居中，上下留白一致 */
.deck > section,.deck > footer{flex:0 0 100%;min-width:0;height:100%;
  position:relative;isolation:isolate;
  display:flex;flex-direction:column;justify-content:safe center;
  scroll-snap-align:start;scroll-snap-stop:always;overflow-y:auto;overscroll-behavior:contain;
  transform-origin:50% 50%;
  contain:layout style;backface-visibility:hidden}
/* 静止态不持有合成层：只有正在变换/模糊的页才占显存 */
.deck > section.is-set{will-change:auto}
.deck > section:not(.is-set){will-change:transform,filter,opacity}
/* 压掉各段自己的 padding，否则每页位置参差不齐 */
.deck > section.hero,.deck > section.sec,.deck > section.close{padding:44px 0}
/* 每页同一层冷暖叠光：黑底不死黑，红/绿只在边缘出现 */
.deck > section::before{content:"";position:absolute;inset:-64px 0 0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(720px 420px at 18% -10%,rgba(255,92,92,.10),transparent 62%),
    radial-gradient(760px 460px at 82% 4%,rgba(50,220,140,.075),transparent 64%),
    radial-gradient(1100px 620px at 50% 30%,rgba(143,166,255,.05),transparent 70%);}

/* 每页底部那条白线：位置与 wrap 内容区对齐 */
.deck > section::after{
  content:"";position:absolute;bottom:44px;
  left:calc((100% - min(100%,1436px)) / 2 + var(--gut));
  right:calc((100% - min(100%,1436px)) / 2 + var(--gut));
  border-top:1px solid var(--line-3);
}

/* 每页内容占同一段竖向区间，与首页同比例，不再一页满一页空 */
.deck > section > .wrap{width:100%}
.deck > section > .wrap:not(.shot-g):not(.close-in){
  min-height:min(560px,62vh);display:flex;flex-direction:column;justify-content:space-between}
.deck > section > .wrap > .sec-head{padding-bottom:0}
.deck .shot-g{min-height:min(560px,62vh)}

.deck-nav{position:fixed;right:26px;top:50%;transform:translateY(-50%);z-index:60;
  display:flex;flex-direction:column;gap:10px}
.deck-nav button{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;
  border:1px solid var(--line-2);background:rgba(8,9,10,.6);color:var(--ink-2);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  transition:color .15s,border-color .15s,background .15s}
.deck-nav button:hover:not(:disabled){color:var(--ink);border-color:rgba(255,255,255,.28);
  background:rgba(8,9,10,.85)}
.deck-nav button:disabled{opacity:.25;cursor:default}
.deck-nav svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.6;
  stroke-linecap:round;stroke-linejoin:round}
.dots{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:60;
  display:flex;gap:7px}
.dots i{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.22);
  transition:width .25s ease,background .25s ease}
.dots i[aria-current]{width:16px;border-radius:3px;background:var(--ink)}

@media (prefers-reduced-motion:reduce){
  .deck > section,.deck > footer{filter:none!important;opacity:1!important;transform:none!important;will-change:auto}
  *{animation:none!important;transition:none!important}
}
```

---

## 7. JS 模块

> 两个 IIFE 按顺序放在同一个 `<script>` 里。都必须在 `DOMContentLoaded` 之后执行（脚本放 body 末尾即可）。

### 7.1 打字机：终端逐字敲出代码

```js
(() => {
  const el = document.getElementById("stream");
  // 一段完整、能跑的 Python：调本地网关
  const raw = [
    'import httpx',
    '',
    'BASE = "http://localhost:7863/v1"',
    '',
    'def ask(prompt: str) -> str:',
    '    r = httpx.post(f"{BASE}/chat/completions", json={',
    '        "model": "deepseek-v4-flash",',
    '        "messages": [{"role": "user", "content": prompt}],',
    '    }, timeout=30)',
    '    return r.json()["choices"][0]["message"]["content"]',
    '',
    'print(ask("你好"))',
  ].join("\n")

  // 关键字蓝 / 字符串绿 / 数字黄，其余白
  const KW = /^(import|def|return|for|in|if|else|class|from|as|with)$/
  const segs = raw.split(/("(?:[^"\\]|\\.)*"|\b\d+\b|[A-Za-z_]+)/)
    .filter(t => t !== undefined && t !== "")
    .map(t => [t, t[0] === '"' ? "s" : KW.test(t) ? "k" : /^\d+$/.test(t) ? "n" : ""])
  const plain = raw
  // 关键字蓝 / 字符串绿 / 数字黄，其余白。相邻的无色段先合并成一段，
  // 这样产出的 DOM 与原 innerHTML 解析结果完全一致（相邻裸文本会被解析器合成一个文本节点）。
  const merged = []
  for (const [t, c] of segs) {
    const last = merged[merged.length - 1]
    if (!c && last && !last[1]) last[0] += t
    else merged.push([t, c])
  }
  // 逐 token 建立：已打完的 token 是静态节点，不再触碰；每帧只重写「正在打的那个 token」
  // （原实现每帧重建整个 <pre> 的 innerHTML）。有色 token 用 <span>，无色 token 用裸文本节点。
  const slots = []          // { host, text, at }
  const emit = (text, cls) => {
    if (!text) return
    const host = cls ? document.createElement('span') : document.createTextNode('')
    if (cls) host.className = cls
    el.appendChild(host)
    slots.push({ host, text, at: 0 })
  }
  for (const [t, c] of merged) emit(t, c)
  // 打完后光标留在末尾闪烁（与原行为一致），独立节点挂在最后，不参与重建
  const caretEl = document.createElement('span')
  caretEl.className = 'caret'
  caretEl.setAttribute('aria-hidden', 'true')
  caretEl.style.display = 'none'
  el.appendChild(caretEl)

  const total = plain.length
  let pos = 0            // 已打出字符数
  let si = 0             // 正在打的 token 下标
  const setText = (s, v) => { if (s.host.nodeType === 3) s.host.data = v; else s.host.textContent = v }
  const render = (n) => {
    // 向前推进：把跨过的 token 定稿
    while (si < slots.length && n >= pos + slots[si].text.length) {
      const s = slots[si]
      if (s.at !== s.text.length) { setText(s, s.text); s.at = s.text.length }
      pos += s.text.length; si++
    }
    if (si < slots.length) {
      const s = slots[si]
      const k = n - pos
      if (k !== s.at) { setText(s, s.text.slice(0, k)); s.at = k }
    }
  }
  const show = (n) => { render(n); caretEl.style.display = '' }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { show(total); return; }

  // 逐字敲出来，出完就停。每帧只改一个 token 的 textContent，布局不变。
  let i = 0;
  const tick = () => {
    show(i)
    if (i >= total) return
    i += 1;
    setTimeout(tick, i < 4 ? 260 : 26);
  };
  setTimeout(tick, 700);
})();

// 横向分页：原生 scroll-snap 滑动 + 滚轮/键盘/箭头，模糊靠 CSS
```

### 7.2 横向分页 + 连续模糊 + 面板 3D 倾斜

```js
(() => {
  const deck = document.getElementById('deck')
  const dots = document.getElementById('dots')
  const prev = document.getElementById('deckPrev')
  const next = document.getElementById('deckNext')
  const slides = [...deck.children].filter(el => /^(SECTION|FOOTER)$/.test(el.tagName))
  let idx = 0

  slides.forEach(() => {
    const d = document.createElement('i')
    d.setAttribute('aria-hidden', 'true')
    dots.appendChild(d)
  })

  // 模糊/缩放按「离视口中心的距离」连续变化：越远越糊越小，靠拢时自然变清楚
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  // 只写发生变化的属性：值没变就不碰 style，静止时不会有多余的样式失效
  const st = slides.map(() => ({}))
  const set = (n, key, val) => { if (st[n][key] !== val) { st[n][key] = val; slides[n].style[key] = val } }
  const paint = () => {
    const w = deck.clientWidth
    if (!w) return
    const mid = deck.scrollLeft + w / 2
    const dl = deck.offsetLeft
    for (let n = 0; n < slides.length; n++) {
      const s = slides[n]
      const off = (s.offsetLeft - dl + s.offsetWidth / 2 - mid) / w
      const a = Math.min(1, Math.abs(off))
      if (reduced) {
        set(n, 'filter', 'none')
        set(n, 'opacity', (1 - a * 0.55).toFixed(3))
        set(n, 'transform', 'none')
        continue
      }
      // 完全离开视口的页直接关掉滤镜，不再占一个 blur 合成层
      if (a >= 1) { set(n, 'filter', 'none'); set(n, 'opacity', '0'); set(n, 'transform', 'scale(0.955)'); continue }
      set(n, 'filter', a < 0.012 ? 'none' : 'blur(' + (a * 16).toFixed(1) + 'px)')
      set(n, 'opacity', (1 - a * 0.7).toFixed(3))
      set(n, 'transform', a >= 0.012 ? 'scale(' + (1 - a * 0.045).toFixed(3) + ')' : 'none')
    }
  }

  const sync = () => {
    paint()
    const i = Math.max(0, Math.min(slides.length - 1, Math.round(deck.scrollLeft / deck.clientWidth)))
    if (i === idx && slides[i].classList.contains('is-active')) return
    idx = i
    slides.forEach((s, n) => s.classList.toggle('is-active', n === i))
    ;[...dots.children].forEach((d, n) => {
      if (n === i) d.setAttribute('aria-current', 'true')
      else d.removeAttribute('aria-current')
    })
    prev.disabled = false
    next.disabled = false
  }

  // 自定义缓动翻页：原生 smooth 的时长改不了，所以自己跑 tween
  const DUR = 1000
  let raf = 0
  // 首尾相接：最后一页再往下回到第一页
  const go = (i) => {
    i = (i + slides.length) % slides.length
    const from = deck.scrollLeft
    const to = i * deck.clientWidth
    if (Math.abs(to - from) < 2) return
    cancelAnimationFrame(raf)
    if (reduced) { deck.scrollLeft = to; return }
    // mandatory 吸附会跟 tween 抢位置，动画期间关掉
    deck.style.scrollSnapType = 'none'
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min(1, (now - t0) / DUR)
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      deck.scrollLeft = from + (to - from) * e
      if (p < 1) raf = requestAnimationFrame(step)
      else { deck.style.scrollSnapType = ''; raf = 0 }
    }
    raf = requestAnimationFrame(step)
  }

  // scroll 事件一帧可能来多次，只留一次 rAF
  let pending = 0
  const onScroll = () => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; sync() }) }
  deck.addEventListener('scroll', onScroll, { passive: true })
  prev.addEventListener('click', () => go(idx - 1))
  next.addEventListener('click', () => go(idx + 1))

  // 竖向滚轮转成翻页；内容比一屏高时先让内容自己滚
  let lock = 0
  deck.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
    const cur = slides[idx]
    if (cur && cur.scrollHeight - cur.clientHeight > 4) {
      const atTop = cur.scrollTop <= 0 && e.deltaY < 0
      const atBottom = cur.scrollTop + cur.clientHeight >= cur.scrollHeight - 2 && e.deltaY > 0
      if (!atTop && !atBottom) return
    }
    e.preventDefault()
    const now = Date.now()
    if (now - lock < DUR + 120) return
    lock = now
    go(idx + Math.sign(e.deltaY))
  }, { passive: false })

  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(idx + 1) }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(idx - 1) }
  })

  addEventListener('resize', () => { deck.scrollLeft = idx * deck.clientWidth; sync() })
  sync()

  // 第二页的面板：固定一个向右的 3D 角度，鼠标移动再叠加一点视差
  const shot = document.querySelector('.shot')
  const shotSec = document.getElementById('product')
  if (shot && shotSec && !reduced) {
    const BASE_X = 6, BASE_Y = -14, MAX = 16
    const apply = (nx, ny) => {
      shot.style.transform =
        `perspective(1400px) rotateX(${(BASE_X - ny * MAX).toFixed(2)}deg)` +
        ` rotateY(${(BASE_Y + nx * MAX).toFixed(2)}deg)`
    }

    // 面板一直长到白线上方 16px（3D 投影会压缩，所以迭代几次收敛）。
    // 注意：这里量的是该页「当前渲染态」的几何，所以必须在该页可见（不带 scale）时算；
    // 结果依赖 paint 写上去的样式，故算法与原来完全一致，只改触发时机。
    const fit = () => {
      shot.style.height = ''
      apply(0, 0)
      const secR = shotSec.getBoundingClientRect()
      const secS = secR.height / shotSec.clientHeight || 1
      const lineY = secR.bottom / secS - 44
      for (let n = 0; n < 4; n++) {
        const bottom = shot.getBoundingClientRect().bottom / secS
        const delta = lineY - 16 - bottom
        if (Math.abs(delta) <= 1) break
        shot.style.height = (shot.offsetHeight + delta) + 'px'
      }
    }

    fit()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit)
    addEventListener('resize', () => fit())

    // 翻页落定后精修一次（原实现：每个 scroll 事件都 setTimeout 180ms 重算）。
    // 防抖本身已经是「停止后才跑」，这里只多加一个闸：不是本页激活就不算，
    // 所以从第 1 页翻到第 3 页这种连续滚动，中间不会白跑。
    let ft = 0
    const refit = () => { if (shotSec.classList.contains('is-active')) fit() }
    deck.addEventListener('scroll', () => { clearTimeout(ft); ft = setTimeout(refit, 180) }, { passive: true })

    // 鼠标视差：每帧最多写一次 transform，用 rAF 合并
    let nx = 0, ny = 0, mr = 0
    const flush = () => { mr = 0; apply(nx, ny) }
    shotSec.addEventListener('mousemove', (e) => {
      const r = shotSec.getBoundingClientRect()
      nx = (e.clientX - r.left) / r.width - 0.5
      ny = (e.clientY - r.top) / r.height - 0.5
      if (!mr) mr = requestAnimationFrame(flush)
    })
    shotSec.addEventListener('mouseleave', () => {
      nx = 0; ny = 0
      if (mr) cancelAnimationFrame(mr)
      mr = requestAnimationFrame(flush)
    })
  }
})();
```

---

## 8. 验收脚本（check.cjs）

每次改完跑 `node check.cjs`，全部 `true` 才算过。断言项：

```js
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
```

---

## 9. 换内容对照表

| 想改什么 | 改哪里 | 不要动 |
|---|---|---|
| 标题 / 说明文案 | §5 骨架里的 `h1` / `.lead` / `.body` | `.wrap` 的宽度规则 |
| 终端里的代码 | §7.1 的 `raw` 数组 | `segs` 切分逻辑、`draw()` |
| 终端代码的行数 | 控制在 12 行内（面板固定 15 行高） | `height:calc((100vh - var(--hdr))/1.618)` |
| 产品面板里的行 | §5 里的 `.acct` 块，**必须保持 9 行** | `.shot-body` 的 `grid-template-rows` |
| 状态颜色 | `.st[data-tone="ok|warn|err"]` | 三个色值 |
| 页数 | `.deck` 里增删 `section`，同步改 `.dots` 与 nav 链接 | `slides` 是自动取的，不用改 JS |
| 主色 | `--accent` | 其余状态色 |

换内容后必须重跑 §8，重点是 `widths`（每页 wrap 宽度一致）、`fits`（溢出）和三个比例值。

> `bands` 只校验 ≤90%。第 2 页的面板是故意撑到白线的（84%），所以三页 band 不一致是正常的；
> 只要 `widths` 一致、`fits` 为 true，就说明用的是同一个模板。

---

## 10. 踩坑表（全部真实踩过，按 root cause 记）

| 症状 | 真正原因 | 修法 |
|---|---|---|
| 每页看起来像不同模板 | flex 列里的 `.wrap` 用了 `margin:0 auto`，宽度塌成内容宽 | `.deck > section > .wrap{width:100%}` |
| 缩小面板后字全糊 | 用 `zoom` / `transform:scale` 缩小整块 | 重写内部字号/行高，不用缩放 |
| 全站动画突然全没了 | 删 CSS 块时漏掉一个 `}`，`@media(prefers-reduced-motion)` 里的 `*{animation:none!important}` 泄漏到全局 | 删块后立刻数括号，跑 §8 |
| 翻页时长改不了 | 原生 `scrollTo({behavior:'smooth'})` 固定约 450ms | 自己写 rAF tween（`DUR=1000`），期间临时 `scroll-snap-type:none` |
| 两页之间是"硬切"不是渐变 | 用 class 切模糊 | 每帧按离中心距离写 inline filter（`paint()`） |
| 3D 倾斜后量出来的行重叠/超高 | `getBoundingClientRect` 是投影后的包围盒 | 量布局用 `offsetTop / offsetHeight` |
| 面板固定高度后行被裁掉 | 行压到 `min-height` 后仍溢出，被 `overflow:hidden` 切掉 | 面板高度由内容撑开 + `fit()` 迭代（投影会压缩，一次算不准） |
| KPI 压住第一行 | `.kpis` 作为 flex item 被 shrink | `.kpis{flex:none}` |
| 打字机 20 秒打不完 | 字数 × 46ms 远超循环周期 | 缩短文本、调 `ms/字`，或干脆去掉循环 |
| 面板想"再大一点"但被比例卡死 | 1:1.618 + 画幅 1440 ⇒ 面板宽上限 = 版心 / 2.618 ≈ 809 | 只能二选一：放宽比例或缩小左栏 |
| 每页底部白线对不齐 | 每页各写一条 div | 统一用 `section::after` + 同一个 `left/right` 公式 |
| 面板/终端发灰没有"黑得发亮" | 用了纯色 `--surface` | 一律 `--panel-grad` 渐变黑 |

---

## 11. 一句话总结

> 三屏横向分页 + 每帧连续模糊 + 渐变黑面板 + 统一 band 规则 + 全部比例锁死在 1:1.618。
> 换内容只动 §9 表里那几处，别动骨架和数值。
