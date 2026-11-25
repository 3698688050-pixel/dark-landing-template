# 竖向翻页复用指南

这里把 `design-demo.html` v3.5 的竖向翻页逻辑拆成可复用模块，不依赖成品的终端或字体。将下列四个代码块分别保存为对应文件，放在同一目录，双击 `index.html` 即可运行。JS 使用经典脚本，支持 `file://`。

| 模块 | 职责 |
|---|---|
| `scroll.css` | 顶栏、整屏高度、原生滚动吸附和高斯模糊的合成提示 |
| `scroll-effects.js` | 共用一帧的滚动位置，更新背景视差和速度驱动的模糊 |
| `scroll-pager.js` | 处理滚轮、键盘、锚点和原生滚动后的页码同步 |

## 页面与接线

将各屏放在 `.stage` 的直属 `<section>` 中，且至少保留一屏。把顶栏和可选的 `.glow` 背景放在 `.stage` 外。用 `data-page-link` 标记翻页链接，用 `data-scroll-inner` 标记可独立竖向滚动的内容。示例从顶栏读取像素高度，与 CSS 中的 `--nav-height` 保持一致。这个版本控制文档滚动，每个页面只初始化一套。

### `index.html`

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>竖向翻页示例</title>
  <link rel="stylesheet" href="scroll.css">
</head>
<body>
  <div class="glow" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <header class="demo-nav">
    <nav aria-label="章节">
      <a data-page-link href="#intro">首页</a>
      <a data-page-link href="#demo">演示</a>
      <a data-page-link href="#next">结束</a>
    </nav>
  </header>
  <main class="stage">
    <section id="intro"><h1>竖向翻页</h1></section>
    <section id="demo">
      <h2>区内滚动</h2>
      <pre data-scroll-inner tabindex="0" aria-label="演示日志"><span>读取配置</span>
检查服务状态
加载本地字体
准备背景图层
设置滚动吸附
绑定键盘导航
更新页面状态
完成初始化
等待下一次操作</pre>
    </section>
    <section id="next"><h2>结束</h2></section>
  </main>
  <script src="scroll-effects.js"></script>
  <script src="scroll-pager.js"></script>
  <script>
    const stage = document.querySelector('.stage');
    const navHeight = document.querySelector('.demo-nav').offsetHeight;
    const effects = createScrollEffects(stage, document.querySelector('.glow'));
    const pager = createScrollPager(stage, navHeight);

    function onScroll() {
      effects.schedule();
      pager.scheduleSync();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    effects.schedule();
  </script>
</body>
</html>
```

## CSS 吸附与图层

顶栏高 64px。每节最小高度为 `100svh` 减去顶栏高度，`scroll-margin-top` 使吸附点位于顶栏下沿。保留 `.stage.is-moving` 的 `will-change`，由 JS 在模糊出现时应用。背景光晕沿用 demo 的色块和固定滤镜。

### `scroll.css`

```css
:root {
  --nav-height: 64px;
  background: #f4efe6;
  scroll-snap-type: y mandatory;
}

body { margin: 0; }
.demo-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  height: var(--nav-height);
  display: flex;
  align-items: center;
  padding-inline: 24px;
  background: rgba(244, 239, 230, .72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.demo-nav nav { display: flex; gap: 16px; }
.stage { position: relative; }
.stage.is-moving { will-change: filter; }
.stage > section {
  box-sizing: border-box;
  min-height: calc(100svh - var(--nav-height));
  scroll-margin-top: var(--nav-height);
  scroll-snap-align: start;
  scroll-snap-stop: always;
  padding: 24px;
}
[data-scroll-inner] { max-height: 96px; overflow-y: auto; }

.glow {
  position: fixed;
  inset: -30%;
  z-index: -1;
  pointer-events: none;
  filter: blur(70px) saturate(1.2);
  will-change: transform;
  transform: translate3d(0, 0, 0);
}
.glow i { position: absolute; border-radius: 50%; mix-blend-mode: multiply; }
.glow i:nth-child(1) {
  width: 42vw; height: 42vw; left: -4vw; top: -6vh;
  background: radial-gradient(circle, #d9a56a, #c98a4a 40%, transparent 72%);
  opacity: .7;
}
.glow i:nth-child(2) {
  width: 36vw; height: 36vw; right: -6vw; top: -4vh;
  background: radial-gradient(circle, #b8642a, #a0522a 40%, transparent 72%);
  opacity: .55;
}
.glow i:nth-child(3) {
  width: 30vw; height: 30vw; left: 28vw; top: 52vh;
  background: radial-gradient(circle, #6a8a8a, #4a6a6a 42%, transparent 72%);
  opacity: .35;
}
.glow i:nth-child(4) {
  width: 28vw; height: 28vw; right: 14vw; top: 66vh;
  background: radial-gradient(circle, #c9905a, #b0703a 40%, transparent 72%);
  opacity: .45;
}
.glow::after {
  content: "";
  position: absolute;
  left: 20vw; top: 10vh; width: 60vw; height: 60vh;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(200,150,90,.18), transparent 65%);
}

@media (prefers-reduced-motion: reduce) {
  .glow { display: none; }
}
```

## JS 滚动视觉

一个待执行的 `requestAnimationFrame` 同时更新视差和模糊。视差按 `0.5×` 位移取整。模糊半径量化到 0.5px、上限 8px，两个非零值之间的写入至少间隔 45ms。直接写 `.stage` 的 `filter`，避免更新继承型自定义属性时扩大样式重算范围。停止时移除内联滤镜和 `.is-moving`。

### `scroll-effects.js`

```js
function createScrollEffects(stage, glow = null) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let lastY = scrollY;
  let lastTime = 0;
  let speed = 0;
  let glowY = 0;
  let paintedRadius = 0;
  let lastWrite = 0;

  function clearBlur() {
    if (!paintedRadius) return;
    paintedRadius = 0;
    stage.style.removeProperty('filter');
    stage.classList.remove('is-moving');
  }

  function paint(now) {
    frame = 0;
    const y = scrollY;
    const parallaxY = Math.round(y * 0.5);
    if (glow && parallaxY !== glowY) {
      glowY = parallaxY;
      glow.style.transform = `translate3d(0,${-glowY}px,0)`;
    }

    const elapsed = Math.max(8, now - lastTime);
    const distance = Math.abs(y - lastY);
    lastY = y;
    lastTime = now;
    // 吸附结束时的小位移不应重新触发模糊。
    speed = distance < 3 ? speed * 0.5 : speed + (distance / elapsed - speed) * 0.5;
    const radius = reducedMotion.matches ? 0 : Math.round(Math.min(8, speed * 1.1) * 2) / 2;
    if (radius === 0) {
      clearBlur();
      return;
    }

    if (radius !== paintedRadius && now - lastWrite >= 45) {
      if (!paintedRadius) stage.classList.add('is-moving');
      stage.style.filter = `blur(${radius}px)`;
      paintedRadius = radius;
      lastWrite = now;
    }
    frame = requestAnimationFrame(paint);
  }

  function schedule() {
    if (frame) return;
    lastY = scrollY;
    lastTime = performance.now();
    frame = requestAnimationFrame(paint);
  }

  function destroy() {
    cancelAnimationFrame(frame);
    clearBlur();
    glow?.style.removeProperty('transform');
  }

  return { schedule, destroy };
}
```

## JS 翻页与输入

滚轮累计位移达到 32px 时翻一屏，导航和键盘也使用 720ms 的 `easeOutQuart`。动画期间暂停 CSS 吸附，落到目标位置后恢复。原生滚动停止 140ms 后同步当前页。内滚区域沿当前方向还能滚动时，保留浏览器默认行为。系统启用减少动态效果时，翻页直接落到目标位置。

### `scroll-pager.js`

```js
function createScrollPager(stage, navHeight) {
  const pages = [...stage.querySelectorAll(':scope > section')];
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const originalSnap = root.style.scrollSnapType;
  const listeners = new AbortController();
  const duration = 720;
  let current = 0;
  let jumpFrame = 0;
  let syncTimer;
  let accumulated = 0;
  let lastWheel = 0;
  let cooldownUntil = 0;

  function syncCurrentPage() {
    if (jumpFrame) return;
    let nearest = Infinity;
    pages.forEach((page, index) => {
      const distance = Math.abs(page.getBoundingClientRect().top - navHeight);
      if (distance < nearest) {
        nearest = distance;
        current = index;
      }
    });
  }

  function scheduleSync() {
    if (jumpFrame) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncCurrentPage, 140);
  }

  function stopJump() {
    cancelAnimationFrame(jumpFrame);
    jumpFrame = 0;
    root.style.scrollSnapType = originalSnap;
  }

  function jump(index) {
    current = Math.max(0, Math.min(pages.length - 1, index));
    const from = scrollY;
    const distance = pages[current].getBoundingClientRect().top - navHeight;
    const to = from + distance;
    if (jumpFrame) stopJump();
    if (Math.abs(distance) < 1) return;
    if (reducedMotion.matches) {
      scrollTo({ top: to, behavior: 'instant' });
      return;
    }

    root.style.scrollSnapType = 'none';
    const start = performance.now();
    function step() {
      const progress = Math.min(1, (performance.now() - start) / duration);
      const eased = 1 - (1 - progress) ** 4;
      scrollTo({ top: from + distance * eased, behavior: 'instant' });
      if (progress < 1) jumpFrame = requestAnimationFrame(step);
      else stopJump();
    }
    jumpFrame = requestAnimationFrame(step);
  }

  function canScrollInner(target, direction) {
    const inner = target.closest?.('[data-scroll-inner]');
    if (!inner) return false;
    const { overflowY } = getComputedStyle(inner);
    if (overflowY !== 'auto' && overflowY !== 'scroll') return false;
    const { scrollTop, scrollHeight, clientHeight } = inner;
    return scrollHeight - clientHeight > 2 &&
      (direction > 0 ? scrollTop + clientHeight < scrollHeight - 1 : scrollTop > 0);
  }

  function onWheel(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
    const { deltaMode, deltaY } = event;
    if (!deltaY || canScrollInner(event.target, deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 120) accumulated = 0;
    lastWheel = now;
    if (jumpFrame || now < cooldownUntil) return;

    let unit = 1;
    if (deltaMode === WheelEvent.DOM_DELTA_LINE) unit = 16;
    if (deltaMode === WheelEvent.DOM_DELTA_PAGE) unit = innerHeight;
    accumulated += deltaY * unit;
    if (Math.abs(accumulated) < 32) return;
    const next = current + Math.sign(accumulated);
    accumulated = 0;
    if (next < 0 || next >= pages.length) return;
    jump(next);
    cooldownUntil = now + duration + 40;
  }

  function onKeyDown(event) {
    const { target, key, shiftKey } = event;
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey ||
        target.isContentEditable || target.closest?.('input, textarea, select, button')) return;
    const down = key === 'PageDown' || key === 'ArrowDown' || (key === ' ' && !shiftKey);
    const up = key === 'PageUp' || key === 'ArrowUp' || (key === ' ' && shiftKey);
    if (down || up) {
      const direction = down ? 1 : -1;
      if (canScrollInner(target, direction)) return;
      event.preventDefault();
      if (!jumpFrame) jump(current + direction);
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      jump(key === 'Home' ? 0 : pages.length - 1);
    }
  }

  function onClick(event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey ||
        event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[data-page-link][href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const index = id ? pages.findIndex(page => page.id === id) : 0;
    if (index < 0) return;
    event.preventDefault();
    jump(index);
  }

  window.addEventListener('wheel', onWheel, { passive: false, signal: listeners.signal });
  window.addEventListener('keydown', onKeyDown, { signal: listeners.signal });
  document.addEventListener('click', onClick, { signal: listeners.signal });
  syncCurrentPage();

  function destroy() {
    listeners.abort();
    clearTimeout(syncTimer);
    if (jumpFrame) stopJump();
  }

  return { scheduleSync, destroy };
}
```

## 单独接入与卸载

只用视差和模糊时，在接线中保留 `effects.schedule()`。只用分页时保留 `pager.scheduleSync()`。`createScrollEffects(stage)` 可以省略背景。视觉模块管理 `.stage` 的 `filter` 和 `.glow` 的 `transform`。内容需要其他滤镜时，把它们放到 `.stage` 的子元素上。

只把 `data-page-link` 用在改变页码的链接上。这些链接走自定义缓动，不更新 `location.hash`。

在路由切换或拆除组件时，先解除共用的滚动监听，再销毁已创建的模块。

```js
window.removeEventListener('scroll', onScroll);
effects.destroy();
pager.destroy();
```

## 验收

```bash
npm install
npx playwright install chromium
node check-scroll-modules.cjs
node check-demo.cjs
node check-viewports.cjs
```

`check-scroll-modules.cjs` 从本页抽取四个代码块，用 `file://` 打开并检查模糊、视差、键盘、滚轮和内滚。成品的设定、视口和像素对照记录见 [设计规范](DESIGN-LANGUAGE.md) 与 [v3.5 实测](README.md#v35-竖向翻页性能优化)。
