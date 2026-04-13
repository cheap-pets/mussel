# principles.md — MUSSEL 4 代码规范与强制约束

> 本文件用于代码生成和 Code Review 场景。
> 每条规范均附有 ✅ 正确 / ❌ 错误 示例，优先阅读你当前场景相关的章节。

---

## 🔴 硬性禁止（任何情况下不得违反）

以下行为无论任何理由均不允许，发现即视为不合规：

1. **禁止硬编码颜色**：不得出现 `#xxx`、`rgb()`、`hsl()`、颜色名（如 `red`、`gray`）
2. **禁止手写 z-index 数值**：不得出现 `z-index: 999`、`z-index: 9999` 等裸数字
3. **禁止使用不在 `{n}x` 体系内的间距**：不得出现 `margin: 12px`、`padding: 6px` 等非基准倍数的间距值
4. **禁止在组件内写大段一次性 CSS**：能用原子类解决的布局，不写 `style` 属性
5. **禁止自造颜色变量**：不得声明未在 tokens.md 中列出的 `--mu-*` 变量

---

## 1. 颜色使用

### 规范 1-A：文字颜色必须使用语义文本变量

```html
<!-- ✅ 正确：使用语义文本色 -->
<h2 class="text-normal">订单列表</h2>
<p class="text-soft">共 32 条记录</p>
<span class="text-muted">已禁用</span>

<!-- ❌ 错误：硬编码颜色 -->
<h2 style="color: #333">订单列表</h2>
<p style="color: #999">共 32 条记录</p>
```

### 规范 1-B：背景色必须使用背景变量

```html
<!-- ✅ 正确 -->
<header style="background: var(--mu-bg-header)">...</header>
<div style="background: var(--mu-bg-overlay)">弹出层</div>

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

### 规范 2-C：禁止出现非 8px 体系的间距

常见错误值：`6px`、`10px`、`12px`、`20px`、`28px`。
如果设计稿标注了这些数值，应向上取整到最近的 `{n}x` 倍数（或与设计师确认）。

---

## 3. 层叠顺序（z-index）

### 规范 3-A：z-index 只能使用 Token 变量

```css
/* ✅ 正确 */
.dropdown {
  z-index: var(--mu-z-index-popup);
}
.drawer {
  z-index: var(--mu-z-index-layer);
}
.dialog {
  z-index: var(--mu-z-index-modal);
}
.toast {
  z-index: var(--mu-z-index-ontop);
}

/* ❌ 错误：手写数字 */
.dropdown {
  z-index: 1000;
}
.dialog {
  z-index: 9999;
}
```

层级高低顺序（由低到高）：`float` < `layer` < `modal` < `popup` < `ontop`

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
  font-size: var(--mu-common-font-size);
  line-height: var(--mu-common-line-height);
}

/* ❌ 错误 */
.label {
  font-size: 14px;
  line-height: 20px;
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
<!-- ✅ 正确 -->
<div style="background: var(--mu-bg-mask); z-index: var(--mu-z-index-modal)">遮罩</div>
<div style="background: var(--mu-bg-overlay); z-index: var(--mu-z-index-modal)">弹窗</div>

<!-- ❌ 错误 -->
<div style="background: rgba(0,0,0,0.4); z-index: 1000">遮罩</div>
```

---

## 8. 禁用与空状态

### 规范 8-A：禁用状态使用专用 Token

```html
<!-- ✅ 正确 -->
<div style="background: var(--mu-bg-disabled); color: var(--mu-text-color-muted)">
  已禁用区域
</div>

<!-- ❌ 错误 -->
<div style="background: #f5f5f5; color: #ccc; cursor: not-allowed">
  已禁用区域
</div>
```

---

## 快速自检清单

生成或修改 UI 代码后，逐项检查：

```
颜色
  [ ] 无硬编码颜色值（#xxx / rgb() / 颜色名）
  [ ] 文字颜色使用 text-* 类或 --mu-text-color-* 变量
  [ ] 背景使用 --mu-bg-* 变量
  [ ] 状态色（成功/警告/危险）使用语义扩展色，非基本色
  [ ] hover 背景使用 -translucent 变体

间距
  [ ] 所有间距为 8px 的 1~4 倍（8/16/24/32px）
  [ ] 使用 gap-{n}x 替代子项 margin
  [ ] 行内元素间距使用 --mu-content-spacing

层叠 & 阴影
  [ ] z-index 使用 --mu-z-index-* 变量，无裸数字
  [ ] box-shadow 使用 --mu-shadow-* 变量

形状 & 边框
  [ ] border-radius 使用 --mu-common-border-radius 或 --mu-window-border-radius
  [ ] 边框颜色使用 border-soft / border-strong 等类

排版
  [ ] 字号使用 --mu-common-font-size，不手写 14px
  [ ] 文字超长使用 .text-ellipsis 或 .line-clamp

布局
  [ ] 全屏布局用 flex + flex-1，不用 calc(100vh - Xpx)
  [ ] 平级元素间距用 gap，不给最后一项以外加 margin
```
