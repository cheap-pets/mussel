# MUSSEL 4 — 样式变量与原子类

> 颜色、间距、原子类等使用规范见 `principles.md` 硬性禁止清单。

---

## 1 - CSS 变量（Tokens）

### 1.1 基本色

用于图标着色、装饰性元素，**不直接用于文本或背景**，应优先使用语义扩展色。

| 变量 | 含义 |
|------|------|
| `--mu-red` | 红色 |
| `--mu-pink` | 粉色 |
| `--mu-grape` | 葡萄紫 |
| `--mu-violet` | 紫罗兰 |
| `--mu-indigo` | 靛蓝 |
| `--mu-blue` | 蓝色 |
| `--mu-cyan` | 青绿色 |
| `--mu-teal` | 蓝绿色 |
| `--mu-green` | 绿色 |
| `--mu-lime` | 青柠色 |
| `--mu-yellow` | 黄色 |
| `--mu-orange` | 橙色 |
| `--mu-gray` | 中性灰（灰阶基准色，按 neutral → gray → primary 优先级派生，见 `install.md`） |
| `--mu-gray-0` ~ `--mu-gray-19` | 由浅到深的 20 级灰阶 |

---

### 1.2 语义扩展色（优先使用）

日常开发中最常用的颜色变量。带数字后缀的变量为色阶（0 最浅，9 最深）。

| 变量 | 默认映射 | 用途 |
|------|---------|------|
| `--mu-primary-color` | blue | 主操作色，按钮、链接、选中态 |
| `--mu-primary-color-0` ~ `--mu-primary-color-9` | — | 主色色阶 |
| `--mu-secondary-color` | — | 次要操作色 |
| `--mu-secondary-color-0` ~ `--mu-secondary-color-9` | — | 次要色色阶 |
| `--mu-success-color` | green | 成功、完成状态 |
| `--mu-success-color-0` ~ `--mu-success-color-9` | — | 成功色色阶 |
| `--mu-warning-color` | orange | 警告、待确认状态 |
| `--mu-warning-color-0` ~ `--mu-warning-color-9` | — | 警告色色阶 |
| `--mu-danger-color` | red | 错误、危险、删除操作 |
| `--mu-danger-color-0` ~ `--mu-danger-color-9` | — | 危险色色阶 |

---

### 1.3 透明色变体（`-translucent`）

所有基本色和语义色均有 `-translucent` 变体，适用于 hover 背景、标签底色等场景。亮色主题透明度 10%；暗色主题（`.mu-dark`）下**语义色与 gray** 升至 20%，12 个基本色仍为 10%。

| 变量 | 用途示例 |
|------|---------|
| `--mu-primary-translucent` | 主色按钮 hover 背景 |
| `--mu-danger-translucent` | 危险操作行高亮背景 |
| `--mu-success-translucent` | 成功状态标签底色 |
| `--mu-warning-translucent` | 警告提示背景 |
| `--mu-gray-translucent` | 通用 hover 背景 |
| `--mu-red-translucent` ~ `--mu-orange-translucent` | 各基本色透明变体 |

---

### 1.4 极浅色变体（`-faint`）

扩展语义色的极浅版本，适用于状态 Badge、Tag 等需要低饱和度底色的场景。暗色主题（`.mu-dark`）下改用**最深色阶 `-9`**（如 `--mu-primary-faint: var(--mu-primary-color-9)`）。

| 变量 | 用途示例 |
|------|---------|
| `--mu-primary-faint` | 主色标签底色 |
| `--mu-secondary-faint` | 次色标签底色 |
| `--mu-success-faint` | 成功状态背景块 |
| `--mu-warning-faint` | 警告状态背景块 |
| `--mu-danger-faint` | 错误状态背景块 |

---

### 1.5 文本颜色（由深到浅）

文本色由 20 级灰阶映射而来，`normal` 与 `subtle` 层级明确拉开。

| 变量 | 原子类 | 适用场景 |
|------|--------|---------|
| `--mu-text-color-strong` | `.text-strong` | 用户输入内容、文章正文、强调标题 |
| `--mu-text-color-normal` | `.text-normal` | 默认正文、常规名称、普通标签（页面主文本） |
| `--mu-text-color-subtle` | `.text-subtle` | 次要信息、描述文字 |
| `--mu-text-color-soft` | `.text-soft` | 副标题、提示文字 |
| `--mu-text-color-muted` | `.text-muted` | 禁用状态文字 |
| `--mu-text-color-weak` | — | 兼容性变量（仅暗色主题定义，映射 gray-12），新代码用 `text-muted` |

功能色文本：`.text-primary` / `.text-secondary` / `.text-success` / `.text-warning` / `.text-danger`

---

### 1.6 背景颜色

| 变量 | 用途 |
|------|------|
| `--mu-bg-normal` | 页面默认背景 |
| `--mu-bg-strong` | 强调区域：导航栏、头部工具栏、底部工具栏 |
| `--mu-bg-fill` | 填充背景：分段控件底色、区块内嵌容器、表头 |
| `--mu-bg-stripe` | 表格斑马纹交替行 |
| `--mu-bg-disabled` | 禁用状态控件背景 |
| `--mu-bg-mask` | 遮罩层背景（全屏覆盖） |
| `--mu-bg-overlay` | 弹出层、浮出面板背景 |

---

### 1.7 边框颜色

边框色由灰阶映射而来，整体柔和、避免喧宾夺主。三档由深到浅：

| 变量 | 原子类 | 用途 |
|------|--------|------|
| `--mu-border-color-strong` | `.border-strong` | 强调性分隔、输入框聚焦边框 |
| `--mu-border-color-normal` | （默认）| 常规组件边框 |
| `--mu-border-color-soft` | `.border-soft` | 轻量分隔线、卡片边框、表格内框 |

---

### 1.8 边框弧度

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--mu-radius-control` | `4px` | 输入框、按钮、标签等常规组件 |
| `--mu-radius-panel` | `8px` | 浮出面板、抽屉等面板级容器 |
| `--mu-radius-modal` | `12px` | 模态对话框 |

> ⚠️ 老版本 `--mu-common-border-radius` / `--mu-window-border-radius` 已废弃，4.0 统一为 `--mu-radius-*`。

---

### 1.9 字体

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--mu-font-sans` | — | 无衬线字体族，正文 |
| `--mu-font-mono` | — | 等宽字体族，代码块 |
| `--mu-font-size-normal` | `14px` | 组件标题、正文主字号 |
| `--mu-font-size-small` | `12px` | 小号文字 |
| `--mu-font-size-large` | `16px` | 大号文字 |

> ⚠️ `--mu-common-font-size` 已废弃，4.0 统一为 `--mu-font-size-normal`。

---

### 1.10 间距

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--mu-base-spacing` | `8px` | 布局间距基准，所有 `{n}x` 类均以此为倍数 |
| `--mu-half-spacing` | `4px` | 半倍间距（base-spacing / 2），组件内紧凑间距 |
| `--mu-inline-spacing` | `6px` | 行内元素间距，图标与文字之间等 |

间距倍数对照（原子类后缀）：

| 后缀 | 像素值 | 典型用途 |
|------|--------|---------|
| `0` | 0 | 清除间距 |
| `half` | 4px | 紧凑组件内部微小间距 |
| `1x` | 8px | 紧凑元素内边距 |
| `2x` | 16px | 常规卡片内边距 |
| `3x` | 24px | 区块间距 |
| `4x` | 32px | 大区域分隔 |

> 间距原子类支持的后缀：`-0` / `-half` / `-1x` ~ `-4x` / `-auto`（padding/margin 同理，`-auto` 即对应方向 `auto`），gap 支持 `gap-none` / `gap-half` / `gap-1x` ~ `gap-4x`。

---

### 1.11 阴影（由浅到深）

| 变量 | 适用元素 |
|------|---------|
| `--mu-shadow-hairline` | 发丝线描边，并作为以下阴影的第一层 |
| `--mu-shadow-focus` | 聚焦的输入控件 |
| `--mu-shadow-float` | 悬浮突出的卡片、按钮 |
| `--mu-shadow-popup` | 下拉菜单、Tooltip、消息提示 |
| `--mu-shadow-layer` | 抽屉面板、侧边浮层 |
| `--mu-shadow-modal` | 模态对话框 |

---

### 1.12 Z-index（层级由低到高）

| 变量 | 适用场景 |
|------|---------|
| `--mu-z-index-float` | 突出卡片、悬浮按钮 |
| `--mu-z-index-layer` | 抽屉、侧边浮层 |
| `--mu-z-index-modal` | 模态对话框 |
| `--mu-z-index-popup` | 下拉框、Tooltip |
| `--mu-z-index-ontop` | 全局消息提示、全屏加载动画（最高层） |

---

### 1.13 控件尺寸

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--mu-control-height-normal` | `32px` | 默认控件高度 |
| `--mu-control-height-small` | `24px` | 小尺寸控件 |
| `--mu-control-height-large` | `40px` | 大尺寸控件 |

> 老版本使用 `--mu-input-size`，4.0 已统一为 `--mu-control-height-*`。

---

### 1.14 暗色主题（`.mu-dark`）

`install` 时设置 `dark: true`（或 `'auto'` 且系统为暗色）会把 `mu-dark` class 加到根元素，token 随之重映射，无需手动覆盖变量：

- **灰阶反转**：文本色改用浅灰——strong=gray-1、normal=gray-4、subtle=gray-7、soft=gray-10、muted=gray-12；
- **边框**：strong=gray-6、normal=gray-9、soft=gray-12；
- **背景**：bg-normal=gray-19、bg-overlay=gray-17、bg-fill=gray-16、bg-stripe=gray-18；
- 透明/极浅变体变化见 §1.3 / §1.4；另设 `color-scheme: dark`。

## 2 - 原子类

> `gap-{n}x` 同样基于 `--mu-base-spacing` 的倍数，另提供 `gap-half`（半倍）和 `gap-none`（清除）。

### 2.1 定位与布局

**定位：**

| 类名              | 说明             |
| ----------------- | ---------------- |
| .static           | position: static |
| .fixed            | position: fixed  |
| .absolute         | position: absolute |
| .relative         | position: relative |
| .sticky           | position: sticky |
| .inset-0          | inset: 0 |

**显示：**

| 类名           | 说明                    |
| -------------- | ----------------------- |
| .inline        | display: inline         |
| .block         | display: block          |
| .inline-block  | display: inline-block   |
| .flex          | display: flex           |
| .inline-flex   | display: inline-flex    |
| .grid          | display: grid           |
| .inline-grid   | display: inline-grid    |
| .contents      | display: contents       |
| .hidden        | display: none           |

**溢出：**

| 类名             | 说明             |
| ---------------- | ---------------- |
| .overflow-auto   | overflow: auto   |
| .overflow-hidden | overflow: hidden |
| .overflow-visible| overflow: visible|
| .overflow-clip   | overflow: clip   |

**Flex 方向：**

| 类名              | 说明                           |
| ----------------- | ------------------------------ |
| .flex-row         | flex-direction: row            |
| .flex-row-reverse | flex-direction: row-reverse    |
| .flex-col         | flex-direction: column         |
| .flex-col-reverse | flex-direction: column-reverse |

**Flex 项目：**

| 类名          | 说明           |
| ------------- | -------------- |
| .flex-none    | flex: none     |
| .flex-0       | flex: 0        |
| .flex-1       | flex: 1 1 0    |
| .flex-2 ~ .flex-8 | flex: 2 2 0 ~ flex: 8 8 0 |
| .flex-auto    | flex: auto     |
| .flex-initial | flex: 0 auto   |
| .flex-grow    | flex-grow: 1   |
| .flex-shrink  | flex-shrink: 1 |

**Flex 快捷类：**

| 类名              | 说明                                        |
| ----------------- | ------------------------------------------- |
| .flex-center      | 同时设置 `align-items: center; justify-content: center` |

**Flex 换行：**

| 类名               | 说明                    |
| ------------------ | ----------------------- |
| .flex-nowrap       | flex-wrap: nowrap       |
| .flex-wrap         | flex-wrap: wrap         |
| .flex-wrap-reverse | flex-wrap: wrap-reverse |

**对齐：**

**align-items / align-self：**

| 类名             | 说明             |
| ---------------- | ---------------- |
| .items-{value}   | align-items      |
| .self-{value}    | align-self       |

可用值：center, start, end, baseline, stretch, flex-start, flex-end, unset, inherit；另提供 `.self-auto`

**justify-content：**

| 类名             | 说明             |
| ---------------- | ---------------- |
| .justify-{value} | justify-content  |

可用值：normal, start, center, end, baseline, stretch, flex-start, flex-end；分布对齐为 `.justify-around` / `.justify-between` / `.justify-evenly`（对应 `space-around` 等）；另提供 `.justify-center-safe` / `.justify-end-safe`（`safe center` / `safe end`，溢出时不丢失起始端内容）

**align-content：**

| 类名               | 说明            |
| ------------------ | --------------- |
| .content-{value}   | align-content   |

可用值：center, start, end, baseline, stretch, flex-start, flex-end；分布对齐为 `.content-around` / `.content-between` / `.content-evenly`

**Grid 对齐（justify-items / justify-self）：**

| 类名                     | 说明           |
| ------------------------ | -------------- |
| .justify-items-{value}   | justify-items  |
| .justify-self-{value}    | justify-self   |

justify-items 可用值：normal, start, center, end, stretch；justify-self 可用值：auto, start, center, end, stretch；另提供 `.justify-items-center-safe` / `.justify-items-end-safe` / `.justify-self-center-safe` / `.justify-self-end-safe`

**Gap：**

| 类名       | 说明                     |
| ---------- | ------------------------ |
| .gap-none  | gap: unset               |
| .gap-half  | gap: calc(--mu-base-spacing / 2)，即 4px |
| .gap-{n}x  | gap: n × 8px（n: 1 ~ 4） |

**Z-index 定位：**

| 类名       | 说明                              |
| ---------- | --------------------------------- |
| .z-float   | z-index: var(--mu-z-index-float)  |
| .z-layer   | z-index: var(--mu-z-index-layer)  |
| .z-modal   | z-index: var(--mu-z-index-modal)  |
| .z-popup   | z-index: var(--mu-z-index-popup)  |
| .z-ontop   | z-index: var(--mu-z-index-ontop)  |

> 上述 `.z-*` 类实际值为 `calc(var(--mu-z-index-*) + var(--z-offset, 0))`，可通过局部设置 `--z-offset` CSS 变量在同一层级内做细粒度的层叠叠加（默认 `0`，不叠加）。

**Flex 辅助元素：**

| 类名                                | 说明                                          |
| ----------------------------------- | --------------------------------------------- |
| .flex-space                        | 弹性占位，flex: 1 1 0                        |
| .flex-space[space="1x"] ~ [space="4x"] | 等间距变体，flex: 0 0 (n × 8px)              |
| .flex-divider                       | 垂直分隔线，flex: 0 0 2px，默认浅色背景       |
| .flex-divider--stroke-1 ~ --stroke-4 | 分隔线宽度，1 ~ 4px                         |
| .flex-divider--pill                 | 胶囊形分隔条，居中、宽高 64px（最大占 50%）、圆角 2px |
| .flex-break                         | 强制换行，flex: 0 0 100%                     |

```html
<div class="flex">
  <mu-button>A</mu-button>
  <div class="flex-space" />          <!-- 弹性占位，推到两端 -->
  <mu-button>B</mu-button>
</div>

<div class="flex">
  <mu-button>A</mu-button>
  <div class="flex-divider" />         <!-- 垂直分隔线 -->
  <mu-button>B</mu-button>
</div>

<div class="flex flex-wrap">
  <mu-button>A</mu-button>
  <mu-button>B</mu-button>
  <div class="flex-break" />           <!-- 强制换行 -->
  <mu-button>C</mu-button>
</div>
```

**Flex 常用组合：**

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

### 2.2 间距

间距基于 `--mu-base-spacing`（默认 8px）的倍数，padding/margin 均支持后缀 `-0` / `-half` / `-{1~4}x` / `-auto`（值为 `auto`）。

**padding：**

| 类名 | 说明 |
| ---- | ---- |
| .p-{s} | 上下左右 padding（s 取 0 / half / 1x ~ 4x / auto） |
| .px-{s} | 水平方向 padding |
| .py-{s} | 垂直方向 padding |
| .pt-{s} | padding-top |
| .pr-{s} | padding-right |
| .pb-{s} | padding-bottom |
| .pl-{s} | padding-left |

**margin：**

| 类名 | 说明 |
| ---- | ---- |
| .m-{s} | 上下左右 margin（s 取 0 / half / 1x ~ 4x / auto） |
| .mx-{s} | 水平方向 margin |
| .my-{s} | 垂直方向 margin |
| .mt-{s} | margin-top |
| .mr-{s} | margin-right |
| .mb-{s} | margin-bottom |
| .ml-{s} | margin-left |

### 2.3 背景与边框

**背景颜色：**

| 类名              | 说明             |
| ----------------- | ---------------- |
| .bg-none          | 清除背景（`background: none`）|
| .bg-normal        | 默认背景色       |
| .bg-strong        | 强调区域背景色   |
| .bg-fill          | 填充背景色       |
| .bg-disabled      | 禁用状态背景色   |
| .bg-overlay       | 弹出层背景色     |
| .bg-mask          | 遮罩层背景色     |

**阴影：**

| 类名                     | 说明                 |
| ------------------------ | -------------------- |
| .shadow-float            | 突出元素阴影         |
| .shadow-popup            | 弹出元素阴影         |
| .shadow-layer            | 浮动层阴影           |
| .shadow-modal            | 模态窗口阴影         |
| .shadow-focus            | 焦点阴影（需 :focus）  |
| .shadow-focus-within     | 焦点阴影（需 :focus-within） |

**圆角：**

`.radius-*` 与 `.mu-radius-*` 两套类名**均存在且等价**（`mu-` 前缀为命名空间隔离的别名，两者都生成）。

| 类名            | 说明                 |
| --------------- | -------------------- |
| .radius-control / .mu-radius-control | 一般组件圆角（4px）  |
| .radius-panel / .mu-radius-panel     | 面板圆角（8px）      |
| .radius-modal / .mu-radius-modal     | 模态窗口圆角（12px） |

**边框宽度 (n: 2 ~ 4, 像素值；1px 用无后缀类)：**

| 类名          | 说明                     |
| ------------- | ------------------------ |
| .border       | 上下左右 1px 边框        |
| .border-n     | 上下左右 npx 边框        |
| .border-x     | 水平方向 1px 边框        |
| .border-x-{n} | 水平方向 npx 边框        |
| .border-y     | 垂直方向 1px 边框        |
| .border-y-{n} | 垂直方向 npx 边框        |
| .border-t     | 上边 1px 边框            |
| .border-t-{n} | 上边 npx 边框            |
| .border-r     | 右边 1px 边框            |
| .border-r-{n} | 右边 npx 边框            |
| .border-b     | 下边 1px 边框            |
| .border-b-{n} | 下边 npx 边框            |
| .border-l     | 左边 1px 边框            |
| .border-l-{n} | 左边 npx 边框            |

**边框颜色：**

每个方向均支持以下四档颜色（方向前缀同边框宽度：`-x` / `-y` / `-t` / `-r` / `-b` / `-l`，无前缀为四边）。

| 颜色后缀        | 说明               |
| --------------- | ------------------ |
| `-soft`         | 浅色边框           |
| `-strong`       | 深色边框           |
| `-primary`      | 主色边框           |
| `-danger`       | 危险色边框         |

颜色与方向可任意组合，共 4 色 × 7 方向（含四边）= 28 个类。

**边框样式：**

每个方向均支持以下三种样式（方向前缀同上）。

| 样式后缀        | 说明             |
| --------------- | ---------------- |
| `-dashed`       | 虚线边框         |
| `-dotted`       | 点线边框         |
| `-double`       | 双线边框         |

样式与方向可任意组合，共 3 样式 × 7 方向（含四边）= 21 个类。

### 2.4 文本排版

**文本颜色：**

**中性文本颜色：**

| 类名                    | 变量名                     | 说明                           |
| ----------------------- | -------------------------- | ------------------------------ |
| .text-strong            | --mu-text-color-strong     | 清晰，常用于用户输入或文章正文 |
| .text-normal            | --mu-text-color-normal     | 常规，常用于各类名称显示       |
| .text-subtle            | --mu-text-color-subtle     | 次要，用于次级文字信息显示     |
| .text-soft              | --mu-text-color-soft       | 柔和，常用于副标题或提示文字   |
| .text-muted             | --mu-text-color-muted      | 淡雅，常用于禁用组件文字       |

**功能色文本颜色：**

| 类名                    | 变量名                   | 说明       |
| ----------------------- | ------------------------ | ---------- |
| .text-primary           | --mu-primary-color       | 主色文本   |
| .text-secondary         | --mu-secondary-color     | 次要色文本 |
| .text-success           | --mu-success-color       | 成功色文本 |
| .text-warning           | --mu-warning-color       | 警告色文本 |
| .text-danger            | --mu-danger-color        | 危险色文本 |

**文本对齐：**

| 类名       | 说明               |
| ---------- | ------------------ |
| .text-left | text-align: left   |
| .text-center | text-align: center |
| .text-right | text-align: right  |

**行高：**

| 类名        | 说明            |
| ----------- | --------------- |
| .leading-none | line-height: 1  |

**文本大小写：**

| 类名         | 说明                      |
| ------------ | ------------------------- |
| .uppercase   | text-transform: uppercase |
| .lowercase   | text-transform: lowercase |
| .capitalize  | text-transform: capitalize |

**空白处理：**

| 类名               | 说明                    |
| ------------------ | ----------------------- |
| .whitespace-normal | white-space: normal     |
| .whitespace-nowrap  | white-space: nowrap     |
| .whitespace-pre    | white-space: pre        |
| .whitespace-pre-line | white-space: pre-line   |
| .whitespace-pre-wrap | white-space: pre-wrap   |
| .whitespace-break-spaces | white-space: break-spaces |

**文本省略：**

| 类名                  | 说明                     |
| --------------------- | ------------------------ |
| .text-ellipsis        | 单行省略，溢出显示省略号 |

实现方式：
```css
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
```

**行数限制：**

| 类名       | 说明                    |
| ---------- | ----------------------- |
| .line-clamp | 多行省略，通过 CSS 变量控制行数 |

使用方式：通过设置 `--line-clamp` CSS 变量来控制显示行数，未设置时默认 2 行。

实现方式：
```css
overflow: hidden;
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: var(--line-clamp, 2);
white-space: pre-line;
```

---

### 2.5 其他工具类

**`mu-` 前缀别名类：** 文本、背景、阴影、圆角四组原子类均有 `.mu-*` 前缀的等价别名（如 `.mu-text-strong` = `.text-strong`、`.mu-bg-normal` = `.bg-normal`、`.mu-shadow-popup` = `.shadow-popup`、`.mu-radius-control` = `.radius-control`），用于避免与项目内同名类冲突的场景。

**指针与选择（pointer.scss）：**

| 类名 | 说明 |
| ---- | ---- |
| .cursor-default / .cursor-auto / .cursor-pointer | cursor |
| .select-none / .select-auto / .select-all / .select-text | user-select |
| .pointer-event-none / .pointer-event-auto | pointer-events |

**链接（link.scss，纯 CSS 类，无对应组件）：**

| 类名 | 说明 |
| ---- | ---- |
| .mu-link | 主色链接样式：指针光标、hover 下划线 |
| .mu-link--danger | 危险色变体 |
| .mu-link[disabled] | 禁用态（灰色、不可点击），表格 link 列内部即使用 |

## 3 - 常用布局模式

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
