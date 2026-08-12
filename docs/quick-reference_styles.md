# MUSSEL 4 - 样式

该文档为样式开发快速参考，涵盖 CSS 变量（Tokens）、原子类与常用布局模式。

> [!NOTE]
>
> 使用原则：
> - 禁止硬编码颜色值（`#fff` / `rgb()` / `hsl()` / 颜色名），一律使用 `--mu-*` 变量
> - 禁止手写 `z-index`、`box-shadow` 数值，使用语义变量
> - 禁止使用原始灰阶 `--mu-gray-*` 作为文字或边框颜色，使用文本色 / 边框色变量
> - 间距只使用 `{n}x` 系列（1x=8px，最大 4x=32px），禁止写 `style="margin: 12px"`
> - 优先使用原子类完成布局，避免在组件内写一次性 CSS



## 1 - 变量



### 1.1 基本颜色

用于图标着色、装饰性元素，**不直接用于文本或背景**，应优先使用语义扩展色。

| 变量名称         | 说明                         |
| ---------------- | ---------------------------- |
| --mu-red         | 红色                         |
| --mu-pink        | 粉色                         |
| --mu-grape       | 葡萄紫                       |
| --mu-violet      | 紫罗兰                       |
| --mu-indigo      | 靛蓝                         |
| --mu-blue        | 蓝色                         |
| --mu-cyan        | 青绿色                       |
| --mu-teal        | 蓝绿色                       |
| --mu-green       | 绿色                         |
| --mu-lime        | 青柠色                       |
| --mu-yellow      | 黄色                         |
| --mu-orange      | 橙色                         |
| --mu-gray        | 中性灰，由主色计算得到       |
| --mu-gray-(0~19) | 由浅到深的灰色，共 20 个     |



### 1.2 语义扩展色（优先使用）

日常开发中最常用的颜色变量，状态色一律使用语义扩展色而非基本色。带数字后缀的变量为色阶（0 最浅，9 最深）。

| 变量名称                   | 默认映射 | 用途                       |
| -------------------------- | -------- | -------------------------- |
| --mu-primary-color         | blue     | 主色，按钮、链接、选中态   |
| --mu-primary-color-(0~9)   | —        | 由浅到深的主色，共 10 个   |
| --mu-secondary-color       | —        | 次要色                     |
| --mu-secondary-color-(0~9) | —        | 由浅到深的次要色，共 10 个 |
| --mu-success-color         | green    | 成功、完成状态             |
| --mu-success-color-(0~9)   | —        | 由浅到深的成功色，共 10 个 |
| --mu-warning-color         | orange   | 警告、待确认状态           |
| --mu-warning-color-(0~9)   | —        | 由浅到深的警告色，共 10 个 |
| --mu-danger-color          | red      | 错误、危险、删除操作       |
| --mu-danger-color-(0~9)    | —        | 由浅到深的危险色，共 10 个 |



### 1.3 透明色（`-translucent`）

所有基本色和语义扩展色均提供 `-translucent` 变体，为对应颜色的 10% 透明度版本，适用于 hover 背景、标签底色等场景。

| 变量名称                   | 说明           |
| -------------------------- | -------------- |
| --mu-gray-translucent      | 灰色透明变体   |
| --mu-red-translucent       | 红色透明变体   |
| --mu-pink-translucent      | 粉色透明变体   |
| --mu-grape-translucent     | 葡萄紫透明变体 |
| --mu-violet-translucent    | 紫罗兰透明变体 |
| --mu-indigo-translucent    | 靛蓝透明变体   |
| --mu-blue-translucent      | 蓝色透明变体   |
| --mu-cyan-translucent      | 青绿色透明变体 |
| --mu-teal-translucent      | 蓝绿色透明变体 |
| --mu-green-translucent     | 绿色透明变体   |
| --mu-lime-translucent      | 青柠色透明变体 |
| --mu-yellow-translucent    | 黄色透明变体   |
| --mu-orange-translucent    | 橙色透明变体   |
| --mu-primary-translucent   | 主色透明变体   |
| --mu-secondary-translucent | 次要色透明变体 |
| --mu-success-translucent   | 成功色透明变体 |
| --mu-warning-translucent   | 警告色透明变体 |
| --mu-danger-translucent    | 危险色透明变体 |



### 1.4 极浅色（`-faint`）

语义扩展色的极浅版本，适用于状态 Badge、Tag 等需要低饱和度底色的场景。

| 变量名称             | 说明           |
| -------------------- | -------------- |
| --mu-primary-faint   | 主色极浅版本   |
| --mu-secondary-faint | 次要色极浅版本 |
| --mu-success-faint   | 成功色极浅版本 |
| --mu-warning-faint   | 警告色极浅版本 |
| --mu-danger-faint    | 危险色极浅版本 |



### 1.5 文本颜色

文本色由灰阶映射而来，禁止直接使用 `--mu-gray-*`。由深到浅排列。

| 变量名称                | 原子类          | 适用场景                                       |
| ----------------------- | --------------- | ---------------------------------------------- |
| --mu-text-color-strong  | .text-strong | 用户输入内容、文章正文、强调标题               |
| --mu-text-color-normal  | .text-normal | 默认正文、常规名称、普通标签（页面主文本）     |
| --mu-text-color-subtle  | .text-subtle | 次要信息、描述文字                             |
| --mu-text-color-soft    | .text-soft   | 副标题、提示文字                               |
| --mu-text-color-muted   | .text-muted  | 禁用状态文字                                   |

功能色文本：`.text-primary` / `.text-secondary` / `.text-success` / `.text-warning` / `.text-danger`



### 1.6 背景颜色

| 变量名称        | 说明                                                       |
| --------------- | ---------------------------------------------------------- |
| --mu-bg-normal  | 页面默认背景                                               |
| --mu-bg-strong  | 强调区域背景，例如导航栏、头部工具栏、底部工具栏           |
| --mu-bg-fill    | 填充背景，例如分段控件底色、区块内嵌容器、表头            |
| --mu-bg-stripe  | 斑马纹交替行背景，用于表格等                               |
| --mu-bg-disabled| 禁用状态控件背景                                           |
| --mu-bg-mask    | 遮罩层背景（全屏覆盖）                                     |
| --mu-bg-overlay | 弹出层、浮出面板默认背景                                   |



### 1.7 边框颜色

边框色由灰阶映射而来，禁止直接使用 `--mu-gray-*`。三档由深到浅。

| 变量名称                 | 原子类         | 用途                           |
| ------------------------ | -------------- | ------------------------------ |
| --mu-border-color-strong | .border-strong | 强调性分隔、输入框聚焦边框     |
| --mu-border-color-normal | （默认）       | 常规组件边框                   |
| --mu-border-color-soft   | .border-soft   | 轻量分隔线、卡片边框、表格内框 |



### 1.8 边框弧度

| 变量名称                  | 说明                                   |
| ------------------------- | -------------------------------------- |
| --mu-radius-control | 一般组件边框弧度，输入框、按钮、标签等 |
| --mu-window-border-radius | 窗口边框弧度，弹窗、抽屉、浮出面板等   |



### 1.9 字体

| 变量名称               | 默认值 | 说明                       |
| ---------------------- | ------ | -------------------------- |
| --mu-font-sans         | —      | 无衬线字体族，正文         |
| --mu-font-mono         | —      | 等宽字体族，代码块         |
| --mu-font-size-normal  | 14px   | 组件标题、正文主字号       |
| --mu-font-size-small   | 12px   | 小号文字                   |
| --mu-font-size-large   | 16px   | 大号文字                   |

> [!WARNING]
>
> `--mu-common-font-size` 已废弃，4.0 统一为 `--mu-font-size-normal`。



### 1.10 间距

| 变量名称             | 默认值 | 说明                                            |
| -------------------- | ------ | ----------------------------------------------- |
| --mu-base-spacing    | 8px    | 布局间距基准值，所有 `{n}x` 类均以此为倍数      |
| --mu-inline-spacing  | 6px    | 行内元素间距，图标与文字之间等                  |

间距倍数对照：

| 倍数 | 像素值 | 典型用途           |
| ---- | ------ | ------------------ |
| 1x   | 8px    | 紧凑元素内边距     |
| 2x   | 16px   | 常规卡片内边距     |
| 3x   | 24px   | 区块间距           |
| 4x   | 32px   | 大区域分隔         |



### 1.11 阴影

阴影由浅到深排列。

| 变量名称          | 适用元素                       |
| ----------------- | ------------------------------ |
| --mu-shadow-focus | 聚焦的输入控件                 |
| --mu-shadow-float | 悬浮突出的卡片、按钮           |
| --mu-shadow-popup | 下拉菜单、Tooltip、消息提示    |
| --mu-shadow-layer | 抽屉面板、侧边浮层             |
| --mu-shadow-modal | 模态对话框                     |



### 1.12 Z-INDEX

层级由低到高排列。

| 变量名称           | 适用场景                                   |
| ------------------ | ------------------------------------------ |
| --mu-z-index-float | 突出卡片、悬浮按钮                         |
| --mu-z-index-layer | 抽屉、侧边浮层                             |
| --mu-z-index-modal | 模态对话框                                 |
| --mu-z-index-popup | 下拉框、Tooltip                            |
| --mu-z-index-ontop | 全局消息提示、全屏加载动画（最高层）       |

> [!NOTE]
>
> 禁止手写 `z-index` 数值，一律使用以上变量。



### 1.13 控件尺寸

| 变量名称                    | 默认值 | 说明           |
| --------------------------- | ------ | -------------- |
| --mu-control-height-normal  | 32px   | 默认控件高度   |
| --mu-control-height-small   | 24px   | 小尺寸控件高度 |
| --mu-control-height-large   | 40px   | 大尺寸控件高度 |

> [!WARNING]
>
> 老版本使用 `--mu-input-size` / `--mu-input-size-small` / `--mu-input-size-large`，4.0 已统一为 `--mu-control-height-*`。



## 2 - 原子类

> [!NOTE]
>
> - 优先使用原子类完成布局，避免在组件内写一次性 CSS
> - 间距只使用 `{n}x` 系列（1x=8px，最大 4x=32px）
> - `gap-{n}x` 同样基于 `--mu-base-spacing` 的倍数

### 2.1 定位与布局

**定位：**

| 类名              | 说明               |
| ----------------- | ------------------ |
| .static           | position: static   |
| .fixed            | position: fixed    |
| .absolute         | position: absolute |
| .relative         | position: relative |
| .sticky           | position: sticky   |
| .inset-0          | inset: 0           |



**显示：**

| 类名          | 说明                |
| ------------- | ------------------- |
| .inline       | display: inline     |
| .block        | display: block      |
| .inline-block | display: inline-block |
| .flex         | display: flex       |
| .inline-flex  | display: inline-flex |
| .grid         | display: grid       |
| .inline-grid  | display: inline-grid |
| .contents     | display: contents   |
| .hidden       | display: none       |



**溢出：**

| 类名               | 说明              |
| ------------------ | ----------------- |
| .overflow-auto     | overflow: auto    |
| .overflow-hidden   | overflow: hidden  |
| .overflow-visible  | overflow: visible |
| .overflow-clip     | overflow: clip    |



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
| .flex-0       | flex: 0 0 0    |
| .flex-1       | flex: 1 1 0    |
| .flex-2 ~ .flex-8 | flex: 2 2 0 ~ flex: 8 8 0 |
| .flex-auto    | flex: auto     |
| .flex-initial | flex: 0 auto   |
| .flex-grow    | flex-grow: 1   |
| .flex-shrink  | flex-shrink: 1 |

**Flex 快捷类：**

| 类名         | 说明                                                        |
| ------------ | ----------------------------------------------------------- |
| .flex-center | 同时设置 `align-items: center; justify-content: center`     |



**Flex 换行：**

| 类名               | 说明                    |
| ------------------ | ----------------------- |
| .flex-nowrap       | flex-wrap: nowrap       |
| .flex-wrap         | flex-wrap: wrap         |
| .flex-wrap-reverse | flex-wrap: wrap-reverse |



**对齐：**

**align-items / align-self：**

| 类名           | 说明        |
| -------------- | ----------- |
| .items-{value} | align-items |
| .self-{value}  | align-self  |
| .self-auto     | align-self: auto |

可用值（items/self）：center, start, end, baseline, stretch, flex-start, flex-end, unset, inherit

**align-content：**

| 类名             | 说明           |
| ---------------- | -------------- |
| .content-{value} | align-content  |

可用值：start, center, end, baseline, stretch, flex-start, flex-end, around, between, evenly（`around`/`between`/`evenly` 对应 `space-*`）

**justify-content：**

| 类名             | 说明           |
| ---------------- | -------------- |
| .justify-{value} | justify-content |

可用值：normal, start, end, left, right, baseline, center, stretch, flex-start, flex-end, around, between, evenly（`around`/`between`/`evenly` 对应 `space-*`）

**justify-content（安全对齐，防溢出截断）：**

| 类名                   | 说明                    |
| ---------------------- | ----------------------- |
| .justify-center-safe   | justify-content: safe center |
| .justify-end-safe      | justify-content: safe end    |

**justify-items（Grid 列方向对齐）：**

| 类名                  | 说明         |
| --------------------- | ------------ |
| .justify-items-{value} | justify-items |

可用值：normal, start, center, end, stretch

| 类名                          | 说明                       |
| ----------------------------- | -------------------------- |
| .justify-items-center-safe    | justify-items: safe center |
| .justify-items-end-safe       | justify-items: safe end    |

**justify-self（Grid 单元格列方向对齐）：**

| 类名                 | 说明        |
| -------------------- | ----------- |
| .justify-self-{value} | justify-self |

可用值：auto, start, center, end, stretch

| 类名                       | 说明                      |
| -------------------------- | ------------------------- |
| .justify-self-center-safe  | justify-self: safe center |
| .justify-self-end-safe     | justify-self: safe end    |



**Gap：**

| 类名      | 说明          |
| --------- | ------------- |
| .gap-none | gap: unset    |
| .gap-{n}x | gap: n * 8px  |



**Z-index 定位：**

| 类名     | 说明                             |
| -------- | -------------------------------- |
| .z-float | z-index: var(--mu-z-index-float) |
| .z-layer | z-index: var(--mu-z-index-layer) |
| .z-modal | z-index: var(--mu-z-index-modal) |
| .z-popup | z-index: var(--mu-z-index-popup) |
| .z-ontop | z-index: var(--mu-z-index-ontop) |



**Flex 辅助元素：**

| 类名                                | 说明                                          |
| ----------------------------------- | --------------------------------------------- |
| .flex-space                         | 弹性占位，flex: 1 1 0                         |
| .flex-space[space="1x"] ~ [space="4x"] | 等间距变体，flex: 0 0 (n × 8px)            |
| .flex-divider                       | 垂直分隔线，flex: 0 0 2px，默认浅色背景       |
| .flex-divider--stroke-1 ~ --stroke-4 | 分隔线宽度，1 ~ 4px                          |
| .flex-divider--pill                 | 胶囊形分隔条，居中、宽高 64px（最大占 50%）、圆角 2px |
| .flex-break                         | 强制换行，flex: 0 0 100%                      |

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

间距基于 `--mu-base-spacing`（默认 8px）的倍数，支持 1x ~ 4x。

**padding (n: 1 ~ 4)：**

| 类名       | 说明             |
| ---------- | ---------------- |
| .p-{n}x    | 上下左右 padding |
| .px-{n}x   | 水平方向 padding |
| .py-{n}x   | 垂直方向 padding |
| .pt-{n}x   | padding-top      |
| .pr-{n}x   | padding-right    |
| .pb-{n}x   | padding-bottom   |
| .pl-{n}x   | padding-left     |

**margin (n: 1 ~ 4)：**

| 类名       | 说明                   |
| ---------- | ---------------------- |
| .m-{n}x    | 上下左右 margin        |
| .mx-{n}x   | 水平方向 margin        |
| .my-{n}x   | 垂直方向 margin        |
| .mt-{n}x   | margin-top             |
| .mr-{n}x   | margin-right           |
| .mb-{n}x   | margin-bottom          |
| .ml-{n}x   | margin-left            |
| .m-auto    | margin: auto           |
| .mx-auto   | 水平方向 margin: auto  |
| .my-auto   | 垂直方向 margin: auto  |
| .mt-auto   | margin-top: auto       |
| .mr-auto   | margin-right: auto     |
| .mb-auto   | margin-bottom: auto    |
| .ml-auto   | margin-left: auto      |



### 2.3 背景与边框

**背景颜色（类名带 `mu-` 前缀）：**

| 类名          | 说明             |
| ------------- | ---------------- |
| .bg-none      | 清除背景（`background: none`）|
| .bg-normal | 默认背景色       |
| .bg-strong | 强调区域背景色   |
| .bg-fill   | 填充背景色       |
| .bg-disabled | 禁用状态背景色   |
| .bg-overlay| 弹出层背景色     |
| .bg-mask   | 遮罩层背景色     |


**阴影：**

| 类名                    | 说明                          |
| ----------------------- | ----------------------------- |
| .shadow-float        | 突出元素阴影                  |
| .shadow-popup        | 弹出元素阴影                  |
| .shadow-layer        | 浮动层阴影                    |
| .shadow-modal        | 模态窗口阴影                  |
| .shadow-focus        | 焦点阴影（需 :focus）         |
| .shadow-focus-within | 焦点阴影（需 :focus-within）  |

**边框宽度 (n: 1 ~ 4, 像素值)：**

| 类名          | 说明                 |
| ------------- | -------------------- |
| .border       | 上下左右 1px 边框    |
| .border-n     | 上下左右 npx 边框    |
| .border-x     | 水平方向 1px 边框    |
| .border-x-{n} | 水平方向 npx 边框    |
| .border-y     | 垂直方向 1px 边框    |
| .border-y-{n} | 垂直方向 npx 边框    |
| .border-t     | 上边 1px 边框        |
| .border-t-{n} | 上边 npx 边框        |
| .border-r     | 右边 1px 边框        |
| .border-r-{n} | 右边 npx 边框        |
| .border-b     | 下边 1px 边框        |
| .border-b-{n} | 下边 npx 边框        |
| .border-l     | 左边 1px 边框        |
| .border-l-{n} | 左边 npx 边框        |

**边框颜色：**

| 类名            | 说明       |
| --------------- | ---------- |
| .border-soft    | 浅色边框   |
| .border-strong  | 深色边框   |
| .border-primary | 主色边框   |
| .border-danger  | 危险色边框 |

**边框样式：**

| 类名           | 说明     |
| -------------- | -------- |
| .border-dashed | 虚线边框 |
| .border-dotted | 点线边框 |
| .border-double | 双线边框 |



### 2.4 文本排版

**中性文本颜色：**

| 类名                  | 变量名                   | 说明                           |
| --------------------- | ------------------------ | ------------------------------ |
| .text-strong       | --mu-text-color-strong   | 清晰，常用于用户输入或文章正文 |
| .text-normal       | --mu-text-color-normal   | 常规，常用于各类名称显示       |
| .text-subtle       | --mu-text-color-subtle   | 次要，用于次级文字信息显示     |
| .text-soft         | --mu-text-color-soft     | 柔和，常用于副标题或提示文字   |
| .text-muted        | --mu-text-color-muted    | 淡雅，常用于禁用组件文字       |

**功能色文本颜色：**

| 类名                   | 变量名               | 说明       |
| ---------------------- | -------------------- | ---------- |
| .text-primary       | --mu-primary-color   | 主色文本   |
| .text-secondary     | --mu-secondary-color | 次要色文本 |
| .text-success       | --mu-success-color   | 成功色文本 |
| .text-warning       | --mu-warning-color   | 警告色文本 |
| .text-danger        | --mu-danger-color    | 危险色文本 |

**文本对齐：**

| 类名         | 说明             |
| ------------ | ---------------- |
| .text-left   | text-align: left |
| .text-center | text-align: center |
| .text-right  | text-align: right |

**文本大小写：**

| 类名        | 说明                      |
| ----------- | ------------------------- |
| .uppercase  | text-transform: uppercase |
| .lowercase  | text-transform: lowercase |
| .capitalize | text-transform: capitalize |

**空白处理：**

| 类名                      | 说明                       |
| ------------------------- | -------------------------- |
| .whitespace-normal        | white-space: normal        |
| .whitespace-nowrap        | white-space: nowrap        |
| .whitespace-pre           | white-space: pre           |
| .whitespace-pre-line      | white-space: pre-line      |
| .whitespace-pre-wrap      | white-space: pre-wrap      |
| .whitespace-break-spaces  | white-space: break-spaces  |

**文本省略：**

| 类名              | 说明                     |
| ----------------- | ------------------------ |
| .text-ellipsis    | 单行省略，溢出显示省略号 |

实现方式：

```css
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
```

**行数限制：**

| 类名        | 说明                              |
| ----------- | --------------------------------- |
| .line-clamp | 多行省略，通过 CSS 变量控制行数   |

使用方式：通过设置 `--line-clamp` CSS 变量来控制显示行数，未设置时默认 2 行。

```html
<p class="line-clamp" style="--line-clamp: 3">超长正文...</p>
```

实现方式：

```css
overflow: hidden;
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: var(--line-clamp, 2);
white-space: pre-line;
```


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
