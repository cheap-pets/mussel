# layout.md — MUSSEL 4 布局原子类速查

> **使用原则**
> - 优先使用原子类完成布局，避免在组件内写一次性 CSS
> - 间距只使用 `{n}x` 系列（1x=8px，最大 4x=32px），禁止写 `style="margin: 12px"`
> - `gap-{n}x` 同样基于 `--mu-base-spacing` 的倍数

---

## 1. 定位（Position）

| 类名 | CSS 等价 |
|------|---------|
| `.static` | `position: static` |
| `.relative` | `position: relative` |
| `.absolute` | `position: absolute` |
| `.fixed` | `position: fixed` |
| `.sticky` | `position: sticky` |

---

## 2. 显示方式（Display）

| 类名 | CSS 等价 | 常用场景 |
|------|---------|---------|
| `.block` | `display: block` | 独占一行的块级元素 |
| `.inline` | `display: inline` | 行内文本元素 |
| `.inline-block` | `display: inline-block` | 行内但可设宽高 |
| `.flex` | `display: flex` | **最常用**，弹性盒布局 |
| `.inline-flex` | `display: inline-flex` | 行内弹性盒 |
| `.grid` | `display: grid` | 网格布局 |
| `.inline-grid` | `display: inline-grid` | 行内网格 |
| `.contents` | `display: contents` | 消除盒模型，子元素直接参与父布局 |
| `.hidden` | `display: none` | 隐藏元素 |

---

## 3. Flex 布局

### 3.1 方向（flex-direction）

| 类名 | CSS 等价 |
|------|---------|
| `.flex-row` | `flex-direction: row`（默认，水平） |
| `.flex-row-reverse` | `flex-direction: row-reverse` |
| `.flex-col` | `flex-direction: column`（垂直） |
| `.flex-col-reverse` | `flex-direction: column-reverse` |

### 3.2 换行（flex-wrap）

| 类名 | CSS 等价 |
|------|---------|
| `.flex-nowrap` | `flex-wrap: nowrap`（默认） |
| `.flex-wrap` | `flex-wrap: wrap` |
| `.flex-wrap-reverse` | `flex-wrap: wrap-reverse` |

### 3.3 子项伸缩（flex item）

| 类名 | CSS 等价 | 说明 |
|------|---------|------|
| `.flex-0` | `flex: 0` | 不伸缩 |
| `.flex-1` | `flex: 1` | 均分剩余空间，最常用 |
| `.flex-2` ~ `.flex-8` | `flex: 2` ~ `flex: 8` | 按比例伸缩 |
| `.flex-auto` | `flex: auto` | 按内容宽度伸缩 |
| `.flex-initial` | `flex: 0 auto` | 不增长，可收缩 |
| `.flex-none` | `flex: none` | 固定尺寸，不伸缩 |
| `.flex-grow` | `flex-grow: 1` | 只增长 |
| `.flex-shrink` | `flex-shrink: 1` | 只收缩 |

### 3.3a 快捷居中

| 类名 | CSS 等价 | 说明 |
|------|---------|------|
| `.flex-center` | `align-items: center; justify-content: center` | 水平垂直同时居中 |

### 3.4 主轴对齐（justify-content）

类名格式：`.justify-{value}`

| value | 说明 |
|-------|------|
| `start` / `flex-start` | 靠左（水平轴） |
| `end` / `flex-end` | 靠右 |
| `center` | 居中 |
| `space-between` | 两端对齐 |
| `space-around` | 均匀分布（含两端） |
| `space-evenly` | 完全等距分布 |

### 3.5 交叉轴对齐（align-items / align-self）

类名格式：`.items-{value}` / `.self-{value}`

| value | 说明 |
|-------|------|
| `center` | 垂直居中（最常用） |
| `start` / `flex-start` | 顶部对齐 |
| `end` / `flex-end` | 底部对齐 |
| `baseline` | 基线对齐 |
| `stretch` | 拉伸填满（默认） |

**常用组合示例：**

```html
<!-- 水平垂直居中 -->
<div class="flex items-center justify-center">...</div>

<!-- 水平两端对齐，垂直居中（工具栏常用） -->
<div class="flex items-center justify-between">
  <span>标题</span>
  <button>操作</button>
</div>

<!-- 垂直列布局，子项均分 -->
<div class="flex flex-col flex-1">
  <div class="flex-none">固定头部</div>
  <div class="flex-1 overflow-auto">可滚动内容区</div>
  <div class="flex-none">固定底部</div>
</div>
```

---

## 4. 间距（Gap）

用于 flex / grid 容器的子项间距，基于 `--mu-base-spacing`（8px）的倍数。

| 类名 | 等价值 |
|------|--------|
| `.gap-none` | `gap: unset` |
| `.gap-1x` | `gap: 8px` |
| `.gap-2x` | `gap: 16px` |
| `.gap-3x` | `gap: 24px` |
| `.gap-4x` | `gap: 32px` |

---

## 4a. Z-index 定位

使用语义类替代手写 z-index 数值。

| 类名 | CSS 等价 |
|------|---------|
| `.z-float` | `z-index: var(--mu-z-index-float)` |
| `.z-layer` | `z-index: var(--mu-z-index-layer)` |
| `.z-modal` | `z-index: var(--mu-z-index-modal)` |
| `.z-popup` | `z-index: var(--mu-z-index-popup)` |
| `.z-ontop` | `z-index: var(--mu-z-index-ontop)` |

---

## 4b. 背景色

| 类名 | CSS 等价 |
|------|---------|
| `.bg-normal` | `background-color: var(--mu-bg-normal)` |
| `.bg-strong` | `background-color: var(--mu-bg-strong)` |
| `.bg-disabled` | `background-color: var(--mu-bg-disabled)` |
| `.bg-overlay` | `background-color: var(--mu-bg-overlay)` |
| `.bg-mask` | `background-color: var(--mu-bg-mask)` |

---

## 5. Padding

格式：`.p{方向}-{n}x`，n 为 1～4。

| 方向缩写 | 说明 | 示例 |
|---------|------|------|
| `.p-{n}x` | 四边 | `.p-2x` → `padding: 16px` |
| `.px-{n}x` | 左右 | `.px-2x` → `padding-left/right: 16px` |
| `.py-{n}x` | 上下 | `.py-1x` → `padding-top/bottom: 8px` |
| `.pt-{n}x` | 上 | `.pt-3x` → `padding-top: 24px` |
| `.pr-{n}x` | 右 | — |
| `.pb-{n}x` | 下 | — |
| `.pl-{n}x` | 左 | — |

**示例：**
```html
<!-- ✅ 正确：卡片内边距 -->
<div class="p-2x">...</div>

<!-- ✅ 正确：工具栏横向内边距 -->
<div class="flex items-center px-2x py-1x">...</div>

<!-- ❌ 禁止：手写内边距 -->
<div style="padding: 16px 8px;">...</div>
```

---

## 6. Margin

格式：`.m{方向}-{n}x`，n 为 1～4，另有 `auto` 系列。

| 类名 | 说明 |
|------|------|
| `.m-{n}x` | 四边 margin |
| `.mx-{n}x` | 左右 margin |
| `.my-{n}x` | 上下 margin |
| `.mt-{n}x` / `.mr-{n}x` / `.mb-{n}x` / `.ml-{n}x` | 单边 margin |
| `.mx-auto` | 水平居中（块级元素） |
| `.ml-auto` | 推到右侧（flex 中常用） |
| `.mt-auto` | 推到底部（flex-col 中常用） |

**示例：**
```html
<!-- 标题右侧追加操作按钮 -->
<div class="flex items-center">
  <h3>列表标题</h3>
  <button class="ml-auto">新增</button>
</div>

<!-- 块级内容水平居中 -->
<div class="mx-auto" style="max-width: 800px">...</div>
```

---

## 7. 边框

### 7.1 边框宽度

| 类名 | 说明 |
|------|------|
| `.border` | 四边 1px 边框 |
| `.border-{n}` | 四边 npx 边框（n: 2～4） |
| `.border-x` / `.border-x-{n}` | 左右边框 |
| `.border-y` / `.border-y-{n}` | 上下边框 |
| `.border-t` / `.border-b` / `.border-l` / `.border-r` | 单边 1px 边框 |
| `.border-t-{n}` 等 | 单边 npx 边框 |

### 7.2 边框颜色（配合宽度类使用）

| 类名 | 对应变量 | 用途 |
|------|---------|------|
| `.border-soft` | `--mu-border-color-soft` | 卡片、分隔线（默认推荐） |
| 默认 | `--mu-border-color-normal` | 输入框、常规组件 |
| `.border-strong` | `--mu-border-color-strong` | 强调边框、聚焦态 |
| `.border-primary` | `--mu-primary-color` | 选中态 |
| `.border-danger` | `--mu-danger-color` | 错误态 |

### 7.3 边框样式

| 类名 | 说明 |
|------|------|
| `.border-dashed` | 虚线（如拖拽上传区域） |
| `.border-dotted` | 点线 |
| `.border-double` | 双线 |

**示例：**
```html
<!-- 常规卡片 -->
<div class="border border-soft p-2x" style="border-radius: var(--mu-window-border-radius)">
  ...
</div>

<!-- 错误态输入框（搭配组件使用） -->
<input class="border border-danger" />

<!-- 分隔线 -->
<hr class="border-t border-soft" />
```

---

## 8. 溢出（Overflow）

| 类名 | CSS 等价 | 常用场景 |
|------|---------|---------|
| `.overflow-auto` | `overflow: auto` | 内容区可滚动 |
| `.overflow-hidden` | `overflow: hidden` | 裁剪超出内容、配合圆角 |
| `.overflow-visible` | `overflow: visible` | 允许浮出（默认） |
| `.overflow-clip` | `overflow: clip` | 硬裁剪，无滚动条 |

---

## 9. 文本溢出

| 类名 | 说明 |
|------|------|
| `.text-ellipsis` / `.mu-text-ellipsis` | 单行溢出省略（`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`） |
| `.line-clamp` | 多行省略，通过 `--line-clamp` CSS 变量指定行数 |

**示例：**
```html
<!-- 单行省略 -->
<span class="text-ellipsis" style="max-width: 200px; display: block">
  超长标题文本内容...
</span>

<!-- 多行省略（最多显示 2 行） -->
<p class="line-clamp" style="--line-clamp: 2">
  超长正文内容超长正文内容超长正文内容...
</p>
```

---

## 10. 常用布局模式速查

### 页面框架（Header + Sidebar + Content）
```html
<div class="flex flex-col" style="height: 100vh">
  <header class="flex-none flex items-center px-2x bg-strong">
    页头
  </header>
  <div class="flex flex-1 overflow-hidden">
    <aside class="flex-none overflow-auto bg-strong" style="width: 240px">
      侧边栏
    </aside>
    <main class="flex-1 overflow-auto p-2x">
      内容区
    </main>
  </div>
</div>
```

### 卡片列表（均匀间距）
```html
<div class="flex flex-col gap-2x">
  <div class="border border-soft p-2x">卡片 1</div>
  <div class="border border-soft p-2x">卡片 2</div>
</div>
```

### 工具栏（左内容 + 右操作）
```html
<div class="flex items-center gap-1x px-2x py-1x border-b border-soft">
  <span class="text-normal">数据列表</span>
  <span class="text-soft ml-2x">共 128 条</span>
  <div class="ml-auto flex items-center gap-1x">
    <button>筛选</button>
    <button>导出</button>
  </div>
</div>
```

### 居中表单区域
```html
<div class="flex flex-1 items-center justify-center p-4x">
  <div class="flex flex-col gap-2x" style="width: 400px">
    <!-- 表单内容 -->
  </div>
</div>
```
