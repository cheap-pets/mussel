# mu-box 布局系统迁移映射表

---

## 1. 移除项

| 移除项 | 说明 |
|--------|------|
| `<mu-box>` 组件 | 已删除，不再可用 |
| `class="mu-box"` CSS 类 | 无对应样式定义，仅是一个无意义的 class 名 |
| `.mu-box` 上的属性选择器样式 | 所有 `margin=`、`padding=`、`border`、`width=`、`height=`、`position=`、`layout=`、`flex=`、`align-items=`、`justify-content=`、`gap=`、`overflow=`、`content-center`、`flex-wrap`、`inline`、`reverse` 等属性选择器均已失效 |
| `class="mu-h-box"` / `class="mu-v-box"` 作为纯 CSS 类 | 不再具有 `display: flex` / `display: flex; flex-direction: column` 的效果 |
| `class="mu-flex-item"` | 无对应样式 |

---

## 2. 组件变更

| 组件 | Mussel 3 渲染 | Mussel 4 渲染 | 迁移方式 |
|------|---------------|---------------|----------|
| `<mu-h-box>` | `<div class="mu-h-box">` | `<div class="flex">` | 改为 `<div class="flex ...">` |
| `<mu-v-box>` | `<div class="mu-v-box">` | `<div class="flex flex-col">` | 改为 `<div class="flex flex-col ...">` |
| `<mu-grid-box>` | `<div class="mu-grid-box">` + 属性选择器 | `<div class="grid">` + 内联 style | **保留组件**，但 `width`/`height`/`padding` 等属性需改用 `style` 或原子类 |
| `<mu-grid-cell>` | `<div>` + 属性选择器 | `<div>` + 内联 style | **保留组件**，通过 `:col-start`/`:col-end`/`:row-start`/`:row-end` props 传值 |

---

## 3. 完整映射表

### 3.1 布局

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `layout="flex"` | `class="flex"` | |
| `layout="grid"` | `class="grid"` | |
| `class="mu-h-box"` | `class="flex"` | 纯 CSS 类用法 |
| `class="mu-v-box"` | `class="flex flex-col"` | 纯 CSS 类用法 |
| `<mu-h-box>` | `<div class="flex ...">` | 组件用法 |
| `<mu-v-box>` | `<div class="flex flex-col ...">` | 组件用法 |
| `content-center` | `class="flex-center"` | 同时设置 align-items: center 和 justify-content: center |
| `flex-wrap` | `class="flex-wrap"` | 注意：旧版还额外设置 `align-items: flex-start`，如需保留需加上 `class="items-start"` |
| `inline` | `class="inline-flex"` | |
| `reverse`（在 h-box 上） | `class="flex-row-reverse"` | |
| `reverse`（在 v-box 上） | `class="flex-col-reverse"` | |

### 3.2 Flex 子项

> 此规则不仅适用于 `mu-box`，也适用于所有 `<mu-*>` 组件（如 `mu-form-field`）。

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `flex="0"` | `class="flex-0"` | |
| `flex="1"` | `class="flex-1"` | |
| `flex="2"` ~ `flex="8"` | `class="flex-2"` ~ `class="flex-8"` | |
| `flex="9"` ~ `flex="12"` | `style="flex: 9"` ~ `style="flex: 12"` | 无对应原子类 |
| `flex="none"` | `class="flex-none"` | |
| `flex="auto"` | `class="flex-auto"` | |
| `flex="1 auto"` | `class="flex-auto"` | 等价于 `flex: auto` |

### 3.3 对齐

| Mussel 3 | Mussel 4 |
|----------|----------|
| `align-items="center"` | `class="items-center"` |
| `align-items="start"` | `class="items-start"` |
| `align-items="end"` | `class="items-end"` |
| `align-items="stretch"` | `class="items-stretch"` |
| `align-items="baseline"` | `class="items-baseline"` |
| `align-self="stretch"` | `class="self-stretch"` |
| `align-self="center"` | `class="self-center"` |
| `justify-content="center"` | `class="justify-center"` |
| `justify-content="space-between"` | `class="justify-space-between"` |
| `justify-content="space-around"` | `class="justify-space-around"` |
| `justify-content="end"` | `class="justify-end"` |

### 3.4 间距

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `padding="1x"` ~ `padding="4x"` | `class="p-1x"` ~ `class="p-4x"` | |
| `padding="0"` | `style="padding: 0"` | |
| `padding-x="1x"` ~ `padding-x="4x"` | `class="px-1x"` ~ `class="px-4x"` | |
| `padding-y="1x"` ~ `padding-y="4x"` | `class="py-1x"` ~ `class="py-4x"` | |
| `padding-top="1x"` | `class="pt-1x"` | |
| `padding-right="1x"` | `class="pr-1x"` | |
| `padding-bottom="1x"` | `class="pb-1x"` | |
| `padding-left="1x"` | `class="pl-1x"` | |
| `margin="1x"` ~ `margin="4x"` | `class="m-1x"` ~ `class="m-4x"` | |
| `margin="0"` | `style="margin: 0"` | |
| `margin="auto"` | `class="m-auto"` | |
| `margin-x="1x"` ~ `margin-x="4x"` | `class="mx-1x"` ~ `class="mx-4x"` | |
| `margin-y="1x"` ~ `margin-y="4x"` | `class="my-1x"` ~ `class="my-4x"` | |
| `margin-top="1x"` | `class="mt-1x"` | |
| `margin-top="auto"` | `class="mt-auto"` | |
| `margin-left="auto"` | `class="ml-auto"` | |
| `margin-right="auto"` | `class="mr-auto"` | |

### 3.5 Gap

| Mussel 3 | Mussel 4 |
|----------|----------|
| `gap="1x"` | `class="gap-1x"` |
| `gap="2x"` | `class="gap-2x"` |
| `gap="3x"` | `class="gap-3x"` |
| `gap="4x"` | `class="gap-4x"` |

### 3.6 边框

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `border`（布尔属性） | `class="border"` | 1px solid |
| `border-right` | `class="border-r"` | |
| `border-left` | `class="border-l"` | |
| `border-top` | `class="border-t"` | |
| `border-bottom` | `class="border-b"` | |
| `border-x` | `class="border-x"` | 左右 |
| `border-y` | `class="border-y"` | 上下 |
| `border="dashed"` | `class="border border-dashed"` | |
| `border="dotted"` | `class="border border-dotted"` | |
| `border="primary"` | `class="border border-primary"` | |
| `border="danger"` | `class="border border-danger"` | |
| `border="muted"` | `class="border border-soft"` | muted → soft |
| `border-radius="window"` | 无原子类，需 `style` | |

### 3.7 尺寸

> 此规则不仅适用于 `mu-box`，也适用于所有未将 `width` / `height` 定义为 props 的 `<mu-*>` 组件（如 `mu-form-field`、`mu-grid-box` 等）。
> `mu-drawer`、`mu-dialog` 等组件已通过 `sizeProps` 声明了 `width` / `height` props，无需迁移。

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `width="100%"` | `style="width: 100%"` | |
| `width="400"` | `style="width: 400px"` | 纯数字视为 px |
| `height="270"` | `style="height: 270px"` | 纯数字视为 px |
| `width="auto"` | `style="width: auto"` | |
| `height="auto"` | `style="height: auto"` | |
| `overflow="auto"` | `class="overflow-auto"` | |
| `overflow="hidden"` | `class="overflow-hidden"` | |

### 3.8 定位

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `position="fixed"` | `class="fixed"` | |
| `position="absolute"` | `class="absolute"` | |
| `position="relative"` | `class="relative"` | |
| `position="fixed" fit` | `class="fixed"` + `style="inset: 0"` | |
| `position="fixed" bottom left` | `class="fixed"` + `style="bottom: 0; left: 0"` | |

### 3.9 背景色

| Mussel 3 | Mussel 4 |
|----------|----------|
| `class="mu-box mu-bg-normal"` | `class="bg-normal"` |
| `class="mu-box mu-bg-strong"` | `class="bg-strong"` |

### 3.10 辅助元素

#### flex-space

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `<div class="mu-space" />` | `<div class="flex-space" />` | flex: 1 1 0 |
| `<div class="mu-space" space="1x" />` | `<div class="flex-space" space="1x" />` | 等间距变体 1x ~ 4x |
| `<div class="mu-space" space="100%" />` | `<div class="flex-break" />` | 强制换行 |

#### flex-divider（原 mu-divider）

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `<div class="mu-divider" />` | `<div class="flex-divider" />` | 默认 2px |
| `<div class="mu-divider" thin />` | `<div class="flex-divider" line-width="1" />` | 1px 细分隔线 |
| 像素值变体 | `class="flex-divider" line-width="{n}"` | 1 ~ 4px |

---

## 4. 升级示例

### 4.1 简单页面容器

```html
<!-- 升级前 -->
<div class="mu-box mu-bg-normal" width="100%" layout="flex" flex-wrap gap="2x" padding="2x">

<!-- 升级后 -->
<div class="bg-normal flex flex-wrap items-start gap-2x p-2x" style="width: 100%">
```

注意：旧版 `flex-wrap` 还会设置 `align-items: flex-start`，如需保留此行为需加上 `items-start`。

### 4.2 固定定位全屏布局

```html
<!-- 升级前 -->
<mu-v-box position="fixed fit" padding="1x">
  <mu-toolbar>...</mu-toolbar>
  <mu-h-box flex="1">
    <div class="mu-box mu-v-box" flex="0" width="240" border-right>
      ...
    </div>
    <div class="mu-box mu-v-box" flex="1">
      ...
    </div>
  </mu-h-box>
</mu-v-box>

<!-- 升级后 -->
<div class="flex flex-col fixed p-1x" style="inset: 0;">
  <mu-toolbar>...</mu-toolbar>
  <div class="flex flex-1">
    <div class="flex flex-col flex-none border-r" style="width: 240px">
      ...
    </div>
    <div class="flex flex-col flex-1">
      ...
    </div>
  </div>
</div>
```

### 4.3 Tabs 页签栏内的分隔符和弹性占位

```html
<!-- 升级前 -->
<template #tab-bar-prepend>
  <label class="mu-label">Customized Tab Bar</label>
  <div class="mu-space" />
  <div class="mu-divider" />
</template>
<template #tab-bar-append>
  <div class="mu-divider" />
  <div class="mu-space" />
  <mu-dropdown-button class="mu-box" caption="artist" :dropdown-items="artists" />
</template>

<!-- 升级后 -->
<template #tab-bar-prepend>
  <label class="mu-label">Customized Tab Bar</label>
  <div class="flex-space" />
  <div class="flex-divider" />
</template>
<template #tab-bar-append>
  <div class="flex-divider" />
  <div class="flex-space" />
  <mu-dropdown-button caption="artist" :dropdown-items="artists" />
</template>
```

### 4.4 Grid 布局（保留组件，调整属性传递方式）

```html
<!-- 升级前 -->
<mu-grid-box width="480" height="270" padding="1x" :columns="7" :rows="5">
  <mu-grid-cell :col-start="1" :col-end="2" :row-start="1" :row-end="2" margin="1x">
    1
  </mu-grid-cell>
</mu-grid-box>

<!-- 升级后：保留组件，width/height/padding 改用 style 或原子类 -->
<mu-grid-box
  class="p-1x"
  style="width: 480px; height: 270px;"
  :columns="7" :rows="5">
  <mu-grid-cell
    :col-start="1" :col-end="2" :row-start="1" :row-end="2"
    class="m-1x">
    1
  </mu-grid-cell>
</mu-grid-box>
```

### 4.5 Scrollbar 容器中的边框

```html
<!-- 升级前 -->
<mu-scroll-box class="scroll-container mu-box" border>
  <div class="mu-box" border style="position: absolute; ...">1</div>
</mu-scroll-box>

<!-- 升级后 -->
<mu-scroll-box class="scroll-container border">
  <div class="border" style="position: absolute; ...">1</div>
</mu-scroll-box>
```

### 4.6 状态框内的弹性布局

```html
<!-- 升级前 -->
<div class="mu-box" layout="flex" margin-top="auto" align-self="stretch">
  <mu-button primary>创建</mu-button>
  <span flex="1" />
  <mu-button>取消</mu-button>
</div>

<!-- 升级后 -->
<div class="flex mt-auto self-stretch">
  <mu-button primary>创建</mu-button>
  <span class="flex-1" />
  <mu-button>取消</mu-button>
</div>
```

---

## 5. 升级检查清单

对每个涉及 `mu-box` 的文件，逐一检查：

- [ ] `class="mu-box"` → 移除，合并到其他 class 中
- [ ] `class="mu-h-box"` / `class="mu-v-box"`（非组件用法）→ `class="flex"` / `class="flex flex-col"`
- [ ] `<mu-h-box>` / `<mu-v-box>` 组件 → `<div class="flex ...">` / `<div class="flex flex-col ...">`
- [ ] `<mu-box>` 组件 → `<div>` + 合并 class
- [ ] `layout="flex"` / `layout="grid"` → `class="flex"` / `class="grid"`
- [ ] `flex="N"` → `class="flex-N"` / `class="flex-none"` / `class="flex-auto"`（适用于 `mu-box` 及所有 `<mu-*>` 组件）
- [ ] `padding=` / `margin=` 系列 → 原子类（`p-*x`、`m-*x`、`px-*x`、`mx-*x` 等）
- [ ] `gap="Nx"` → `class="gap-Nx"`
- [ ] `align-items=` / `align-self=` / `justify-content=` → 原子类（`items-*`、`self-*`、`justify-*`）
- [ ] `border` / `border-right` 等 → `class="border"` / `class="border-r"` 等
- [ ] `position="fixed fit"` → `class="fixed"` + `style="inset: 0"`
- [ ] `width=` / `height=` → `style="width: ..."` / `style="height: ..."`（适用于 `mu-box` 及所有未声明 `width`/`height` props 的 `<mu-*>` 组件，如 `mu-form-field`、`mu-grid-box`）
- [ ] `overflow=` → `class="overflow-*"`
- [ ] `content-center` → `class="flex-center"`
- [ ] `class="mu-space"` → `class="flex-space"`（flex: 1 1 0），`space="Nx"` 保留为属性 `[space="Nx"]`
- [ ] `class="mu-space" space="100%"` → `class="flex-break"`
- [ ] `class="mu-divider"` → `class="flex-divider"`（默认 2px），`thin` 改为 `line-width="1"`
- [ ] `class="mu-box mu-bg-normal"` → `class="bg-normal"`
- [ ] `<mu-grid-box>` 上非 props 的属性（`width`、`height`、`padding`）→ `style` 或原子类（已包含在上条通用规则中）
- [ ] `<mu-grid-cell>` 上的 `margin=` → `class="m-*x"`
