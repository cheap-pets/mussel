# principles.md — MUSSEL 4 代码规范与强制约束

> 本文件用于代码生成和 Code Review 场景。
> 每条规范均附有 ✅ 正确 / ❌ 错误 示例，优先阅读你当前场景相关的章节。

---

## 🔴 核心规范

> 以下规范在生成和 Review 代码时必须逐条核对。第 1 条为优先级要求（默认遵守、有合理例外），第 2–5 条为硬性禁止（任何情况不得违反）。

1. **优先使用语义颜色**：优先使用 `styles.md` 中定义的语义 CSS 变量，仅在变量无法覆盖的场景（SVG 内联色、第三方组件深层覆盖、动态计算色等）才使用具体颜色值
2. **禁止手写 z-index 数值**：不得出现 `z-index: 999`、`z-index: 9999` 等裸数字，必须使用 `--mu-z-index-*` 变量
3. **禁止使用非基准倍数的间距**：间距必须取 `0`（`.p-0` / `.m-0` / `.gap-none`）、`half`（`.p-half` / `.m-half` / `.gap-half`，=4px）、`1x` ~ `4x`（=8/16/24/32px）等基准倍数，不得出现无法换算为这些倍数的裸值（如 `7px`、`13px`）。行内元素（图标与文字间距等）例外，使用 `--mu-content-spacing`
4. **禁止用 `style`/`<style>` 写可被原子类替代的样式**：布局、间距、对齐、显示性等能用原子类表达的，一律用原子类；仅当原子类无法覆盖（如动态值、特殊动画）才写 `style`，且不得在组件内堆砌大段一次性 CSS
5. **禁止自造 `--mu-*` 变量**：不得声明未在 `styles.md` 中列出的 `--mu-*` 变量（含颜色、尺寸、z-index 等）

---

## 1. 颜色使用

### 规范 1-A：文字颜色必须使用语义文本变量

```html
<!-- ✅ 正确：使用语义文本色（5 档：strong/normal/subtle/soft/muted） -->
<h2 class="text-strong">文章标题</h2>
<p class="text-normal">订单列表</p>
<p class="text-subtle">共 32 条记录</p>
<p class="text-soft">副标题或提示</p>
<span class="text-muted">已禁用</span>

<!-- ❌ 错误：硬编码颜色 -->
<h2 style="color: #333">订单列表</h2>
<p style="color: #999">共 32 条记录</p>
```

### 规范 1-B：背景色必须使用背景变量

```html
<!-- ✅ 正确：有对应原子类的优先用原子类（.bg-normal/.bg-strong/.bg-fill/.bg-disabled/.bg-overlay/.bg-mask） -->
<header class="bg-strong">...</header>
<div class="bg-overlay">弹出层</div>

<!-- ✅ 正确：无对应原子类时才用 style + 变量（如 stripe） -->
<div style="background: var(--mu-bg-stripe)">斑马纹行</div>

<!-- ❌ 错误 -->
<header style="background: #f5f5f5">...</header>
<div style="background: rgba(0,0,0,0.5)">弹出层</div>
```

### 规范 1-C：状态色使用语义扩展色，不用基本色

```html
<!-- ✅ 正确：成功/警告/危险场景用语义色 -->
<span class="text-success">支付成功</span>
<span class="text-danger">余额不足</span>
<div style="background: var(--mu-danger-faint); color: var(--mu-danger-color)">
  表单验证失败
</div>

<!-- ❌ 错误：直接用基本色 -->
<span style="color: var(--mu-green)">支付成功</span>
<span style="color: var(--mu-red)">余额不足</span>
```

### 规范 1-D：hover/激活背景优先使用透明色变体

```css
/* ✅ 正确：hover 使用 translucent 变体 */
.item:hover {
  background: var(--mu-gray-translucent);
}
.item.active {
  background: var(--mu-primary-translucent);
  color: var(--mu-primary-color);
}

/* ❌ 错误：手写 rgba */
.item:hover {
  background: rgba(0, 0, 0, 0.05);
}
```

---

## 2. 间距使用

### 规范 2-A：布局间距只用 `{n}x` 原子类

```html
<!-- ✅ 正确：使用间距原子类 -->
<div class="p-2x">卡片内容</div>
<div class="flex flex-col gap-2x">列表项</div>
<div class="mt-3x">上方留白区域</div>

<!-- ❌ 错误：手写间距 -->
<div style="padding: 16px">卡片内容</div>
<div style="margin-top: 24px">上方留白区域</div>
```

### 规范 2-B：行内元素间距使用 `--mu-content-spacing`

```css
/* ✅ 正确：图标与文字之间的间距 */
.icon + .label {
  margin-left: var(--mu-content-spacing);
}

/* ❌ 错误 */
.icon + .label {
  margin-left: 5px;
}
```

### 规范 2-C：禁止出现非基准倍数的间距

合法间距值只有：`0`、`4px`（half）、`8px`（1x）、`16px`（2x）、`24px`（3x）、`32px`（4x）。
常见错误值与替代建议：

| 错误值 | 建议替代 |
|--------|----------|
| `6px` / `5px` | `gap-half`（4px）或 `1x`（8px）；图标-文字间距用 `--mu-content-spacing` |
| `10px` / `12px` | `1x`（8px）或 `2x`（16px）向上取整 |
| `20px` / `28px` | `2x`（16px）或 `3x`（24px）向上取整 |

设计稿标注了这些数值时，应取整到最近的基准倍数（或与设计师确认）。

---

## 3. 层叠顺序（z-index）

### 规范 3-A：z-index 只能使用 Token 变量

```css
/* ✅ 正确：按层级由低到高选用对应变量（默认值见右注释） */
.floating-card { z-index: var(--mu-z-index-float); }   /* 1 */
.drawer        { z-index: var(--mu-z-index-layer); }   /* 10 */
.dialog        { z-index: var(--mu-z-index-modal); }   /* 100 */
.dropdown      { z-index: var(--mu-z-index-popup); }   /* 1000 */
.toast         { z-index: var(--mu-z-index-ontop); }   /* 10000 */

/* ❌ 错误：手写数字 */
.dropdown {
  z-index: 1000;
}
.dialog {
  z-index: 9999;
}
```

层级高低顺序（由低到高）：`float`(1) < `layer`(10) < `modal`(100) < `popup`(1000) < `ontop`(10000)

---

## 4. 阴影使用

### 规范 4-A：阴影必须匹配元素的视觉层次

```css
/* ✅ 正确：按元素类型选用对应阴影 */
.card:focus-within   { box-shadow: var(--mu-shadow-focus); }
.floating-card       { box-shadow: var(--mu-shadow-float); }
.dropdown-menu       { box-shadow: var(--mu-shadow-popup); }
.drawer-panel        { box-shadow: var(--mu-shadow-layer); }
.modal-dialog        { box-shadow: var(--mu-shadow-modal); }

/* ❌ 错误：手写阴影 */
.dropdown-menu {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

---

## 5. 边框与圆角

### 规范 5-A：圆角只用 Token 变量，不写像素值

```css
/* ✅ 正确 */
.input    { border-radius: var(--mu-common-border-radius); }
.modal    { border-radius: var(--mu-window-border-radius); }
.dropdown { border-radius: var(--mu-window-border-radius); }

/* ❌ 错误 */
.input { border-radius: 4px; }
.modal { border-radius: 8px; }
```

### 规范 5-B：边框颜色使用语义类，不写颜色值

```html
<!-- ✅ 正确 -->
<div class="border border-soft">普通卡片</div>
<input class="border border-danger" />  <!-- 错误态 -->

<!-- ❌ 错误 -->
<div style="border: 1px solid #e5e7eb">普通卡片</div>
<input style="border-color: red" />
```

---

## 6. 字体与排版

### 规范 6-A：字号使用 Token，不手写 px

```css
/* ✅ 正确 */
.label {
  font-size: var(--mu-font-size-normal);
}

/* ❌ 错误 */
.label {
  font-size: 14px;
}
```

### 规范 6-B：字体族使用 Token

```css
/* ✅ 正确 */
body    { font-family: var(--mu-font-sans); }
code    { font-family: var(--mu-font-mono); }

/* ❌ 错误 */
body    { font-family: 'PingFang SC', sans-serif; }
```

### 规范 6-C：文字超长用原子类处理，不手写 CSS

```html
<!-- ✅ 正确：单行省略 -->
<span class="text-ellipsis" style="max-width: 200px; display: block">
  超长文本内容
</span>

<!-- ✅ 正确：多行省略（最多 3 行） -->
<p class="line-clamp" style="--line-clamp: 3">超长正文...</p>

<!-- ❌ 错误：重复实现已有原子类的效果 -->
<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; display: block">
  超长文本内容
</span>
```

---

## 7. 布局结构

### 规范 7-A：全屏布局优先使用 flex 拉伸，不用固定高度计算

```html
<!-- ✅ 正确：flex 自适应布局 -->
<div class="flex flex-col" style="height: 100vh">
  <header class="flex-none">固定头部</header>
  <main class="flex-1 overflow-auto">自适应内容区</main>
  <footer class="flex-none">固定底部</footer>
</div>

<!-- ❌ 错误：用 calc 计算高度（brittle，难维护） -->
<header style="height: 56px">固定头部</header>
<main style="height: calc(100vh - 56px - 48px); overflow: auto">内容区</main>
<footer style="height: 48px">固定底部</footer>
```

### 规范 7-B：平级元素间距使用 `gap`，不给每个子项加 margin

```html
<!-- ✅ 正确：用 gap 统一间距 -->
<div class="flex flex-col gap-2x">
  <div>列表项 1</div>
  <div>列表项 2</div>
  <div>列表项 3</div>
</div>

<!-- ❌ 错误：每个子项加 margin-bottom -->
<div class="flex flex-col">
  <div style="margin-bottom: 16px">列表项 1</div>
  <div style="margin-bottom: 16px">列表项 2</div>
  <div>列表项 3</div>
</div>
```

### 规范 7-C：遮罩层和弹出层背景使用 Token

```html
<!-- ✅ 正确：背景优先用原子类，z-index 用类 -->
<div class="bg-mask z-modal">遮罩</div>
<div class="bg-overlay z-modal">弹窗</div>

<!-- ❌ 错误 -->
<div style="background: rgba(0,0,0,0.4); z-index: 1000">遮罩</div>
```

---

## 8. 禁用与空状态

### 规范 8-A：禁用状态使用专用 Token

```html
<!-- ✅ 正确：背景用原子类，文字色用类 -->
<div class="bg-disabled text-muted">已禁用区域</div>

<!-- ❌ 错误 -->
<div style="background: #f5f5f5; color: #ccc; cursor: not-allowed">
  已禁用区域
</div>
```

---

## 快速自检清单

生成或修改 UI 代码后逐项核对。`(核心规范 N)` 为该条对应的规则来源；核心规范 1 为优先级要求（有合理例外），2–5 为硬性禁止（违反即不合规）。

**硬性禁止**

- [ ] (核心规范 2) z-index 无裸数字，只用 `var(--mu-z-index-*)` 或 `.z-*` 类
      判定：`grep "z-index\s*:\s*\d"` 应只命中 `var()`
- [ ] (核心规范 3) 间距无非法裸值，padding/margin/gap 只用 `-0` / `-half` / `-1x`~`-4x` 后缀；
      行内元素间距用 `--mu-content-spacing`
      判定：其余 px 裸值（7px/13px 等）均为违规，`grep "margin.*:\s*5px"` 应为空
- [ ] (核心规范 4) 样式尽量原子化，能用原子类的（布局/间距/对齐/显示性）一律用原子类，
      不写进 `style`/`<style>`；组件内不得堆砌大段一次性 CSS
- [ ] (核心规范 5) 不自造 `--mu-*` 变量，所有 `--mu-*` 均可在 `styles.md` 第 1 节查到出处
- [ ] (核心规范 5) `border-radius` 用 `--mu-common-border-radius` / `--mu-window-border-radius`，无 4px/8px 裸值
      判定：`grep "border-radius\s*:\s*\d"` 应只命中 `var()`
- [ ] (核心规范 5) 字号用 `--mu-font-size-normal` / `-small` / `-large`，不手写 14px
      判定：`grep "font-size\s*:\s*\d"` 应只命中 `var()`
- [ ] (核心规范 5) `box-shadow` 用 `--mu-shadow-*` 变量或 `.shadow-*` 类，无手写阴影
      判定：`grep "box-shadow\s*:\s*\d"` 应只命中 `var()`

**优先级要求**

- [ ] (核心规范 1) 无硬编码颜色值，`#xxx` / `rgb()` / 颜色名应仅出现在 SVG 内联色、第三方深层覆盖等例外
      - 文字色：用 `.text-*` 类或 `--mu-text-color-*` 变量
      - 背景色：优先 `.bg-*` 类，其次 `--mu-bg-*` 变量
      - 状态色：成功/警告/危险用语义扩展色，非 `--mu-green`/`--mu-red` 等基本色
      - hover/激活背景：用 `-translucent` 变体，不手写 `rgba`
      - 边框颜色：用 `.border-soft` / `-strong` 等类
        判定：`grep "border.*:\s*1px solid #"` 应为空

---

> **已废弃 API 不在本文件列出**。Mussel 3 → 4 的属性废弃与替代方案集中在 `references/upgrade/rules.md`「迁移规则 5 组件迁移」中，生成迁移相关代码时查阅该文件。
