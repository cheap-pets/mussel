# 设计原则

Mussel 的样式体系建立在 CSS 变量（Design Tokens）与原子类之上。编写界面代码时遵循以下规范，可以保证界面在主题换肤、暗色模式下表现一致。

## 核心规范

1. **优先使用语义颜色**：优先使用[样式变量](/guide/styles)中定义的语义 CSS 变量，仅在变量无法覆盖的场景（SVG 内联色、第三方组件深层覆盖、动态计算色等）才使用具体颜色值
2. **禁止手写 z-index 数值**：不得出现 `z-index: 999`、`z-index: 9999` 等裸数字，必须使用 `--mu-z-index-*` 变量
3. **禁止使用非基准倍数的间距**：间距必须取基准倍数 `0` / `half`(4px) / `1x`~`4x`(8/16/24/32px)，不得出现 `7px`、`13px` 等裸值；行内元素（图标与文字间距等）例外，使用 `--mu-inline-spacing`
4. **禁止用 `style`/`<style>` 写可被原子类替代的样式**：布局、间距、对齐、显示性等能用原子类表达的，一律用原子类；仅当原子类无法覆盖（如动态值、特殊动画）才写 `style`
5. **禁止自造 `--mu-*` 变量**：不得声明未在样式变量清单中列出的 `--mu-*` 变量

## 颜色

### 文字颜色使用语义文本变量

```html
<!-- ✅ 正确：5 档语义文本色 -->
<h2 class="text-strong">文章标题</h2>
<p class="text-normal">订单列表</p>
<p class="text-subtle">共 32 条记录</p>
<span class="text-muted">已禁用</span>

<!-- ❌ 错误：硬编码颜色 -->
<p style="color: #999">共 32 条记录</p>
```

### 状态色使用语义扩展色，不用基本色

```html
<!-- ✅ 正确 -->
<span class="text-success">支付成功</span>
<span class="text-danger">余额不足</span>

<!-- ❌ 错误：直接用基本色 -->
<span style="color: var(--mu-green)">支付成功</span>
```

### hover/激活背景优先使用透明色变体

```css
/* ✅ 正确 */
.item:hover {
  background: var(--mu-gray-translucent);
}

/* ❌ 错误：手写 rgba */
.item:hover {
  background: rgba(0, 0, 0, 0.05);
}
```

## 间距

布局间距只用 `{n}x` 原子类，平级元素间距使用 `gap`：

```html
<!-- ✅ 正确 -->
<div class="p-2x">卡片内容</div>
<div class="flex flex-col gap-2x">列表项</div>

<!-- ❌ 错误 -->
<div style="padding: 16px">卡片内容</div>
<div style="margin-bottom: 16px">列表项</div>
```

行内元素间距（图标与文字之间等）使用 `--mu-inline-spacing`：

```css
.icon + .label {
  margin-left: var(--mu-inline-spacing);
}
```

## 层叠顺序（z-index）

按「要盖住的目标」选层级，只与压盖目标比较，不贪高：

| 层级 | 默认值 | 适用场景 |
|------|--------|---------|
| `--mu-z-index-above` | 1 | 盖过相邻兄弟：active/focus 态、固定列 |
| `--mu-z-index-layer` | 10 | 容器内覆盖层：悬浮滚动条、嵌入式抽屉 |
| `--mu-z-index-modal` | 100 | 全屏遮罩及模态对话框 |
| `--mu-z-index-popup` | 1000 | 下拉面板、右键菜单、Tooltip |
| `--mu-z-index-ontop` | 10000 | 全局消息提示、Toast |

```css
/* ✅ 正确 */
.dropdown { z-index: var(--mu-z-index-popup); }

/* ❌ 错误 */
.dropdown { z-index: 1000; }
```

同级偏移用 `calc(var(--mu-z-index-<level>) + N)` 或 `.z-*` 类配合局部 `--z-offset` 变量。

## 阴影与圆角

阴影必须匹配元素的视觉层次，圆角只用 Token 变量：

```css
/* ✅ 正确 */
.card:focus-within { box-shadow: var(--mu-shadow-focus); }
.dropdown-menu     { box-shadow: var(--mu-shadow-popup); border-radius: var(--mu-radius-panel); }
.modal-dialog      { box-shadow: var(--mu-shadow-modal); border-radius: var(--mu-radius-modal); }

/* ❌ 错误 */
.dropdown-menu { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 8px; }
```

## 字体与排版

```css
/* ✅ 正确 */
.label { font-size: var(--mu-font-size-normal); }

/* ❌ 错误 */
.label { font-size: 14px; }
```

文字超长用原子类处理：

```html
<!-- 单行省略 -->
<span class="text-ellipsis" style="max-width: 200px; display: block">超长文本内容</span>

<!-- 多行省略（默认 2 行） -->
<p class="line-clamp" style="--line-clamp: 3">超长正文内容</p>
```

## 布局结构

全屏布局优先使用 flex 拉伸，不用固定高度计算：

```html
<!-- ✅ 正确：flex 自适应布局 -->
<div class="flex flex-col" style="height: 100vh">
  <header class="flex-none">固定头部</header>
  <main class="flex-1 overflow-auto">自适应内容区</main>
  <footer class="flex-none">固定底部</footer>
</div>

<!-- ❌ 错误：calc 计算高度，脆弱难维护 -->
<main style="height: calc(100vh - 56px - 48px); overflow: auto">内容区</main>
```
