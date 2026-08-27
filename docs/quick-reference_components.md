# MUSSEL 4 - 组件

该文档为组件开发快速参考，请结合示例代码进行使用。



## 0 - 安装

Mussel 通过 `install` 作为 Vue 插件挂载。`install` 接收一个 Vue 应用实例和可选的配置对象，完成组件注册、图标注册、主题色配置、多语言设置，并注入全局 `$mussel` 上下文。返回传入的 `app`，便于链式 `.mount()`。

```javascript
import { createApp } from 'vue'
import { install, installIcons } from 'mussel'

const app = createApp(App)

install(app, {
  root: '#app',
  dark: 'auto',
  colors: { primary: '#1c7ed6' },
  icons: { edit: EditIcon },
  locale: 'zh',
  localeResources: { ... }
}).mount('#app')
```

### install(app, options)

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| app | App | Vue 应用实例（`createApp` 返回值），必填 |
| options | Object | 安装配置，见下表 |

### options 选项

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| root | String \| Element | `document.body` | 应用根元素（字符串选择器或 DOM 元素），用于注入主题 class 和 CSS 变量 |
| dark | Boolean \| `'auto'` | — | 暗色模式开关。`true` 强制暗色，`'auto'` 跟随系统 `prefers-color-scheme`，不设置或 `false` 为亮色 |
| colors | Object | 内置默认色 | 自定义主题色，支持的 key：`primary` / `secondary` / `success` / `warning` / `danger` / `neutral` / `gray`，会自动派生对应调色板与 `--mu-*` CSS 变量 |
| icons | Object | — | 初始注册的图标集合，`{ 名称: svg数据或class字符串 }`，等价于调用 `installIcons(icons)` |
| locale | String | 自动检测 | 语言：`'zh'` \| `'en'`，未指定时按浏览器语言自动判断（中文环境为 `zh`，否则 `en`） |
| localeResources | Object | — | 自定义语言包，写入指定 `locale` 下；Mussel 内置 `zh` / `en` |
| *(其他)* | — | — | 其余字段作为 `componentOptions` 存入 `$mussel.options`，供组件读取（如 `gridCell.endOffset`、`splitter.*`、`tree.*` 等） |

> [!NOTE]
>
> `install` 内部执行顺序：注入 `$mussel` 上下文 → 设置根元素 class（`mu-root` + `mu-dark`，由 `dark` 决定）→ 设置主题色（`setupColors`）→ 设置语言（`setupLocale`）→ 注册图标（`installIcons`）→ 注册全部组件 → 注册滚动指令（`v-mu-scrollbar`）。

### 全局 `$mussel` 上下文

`install` 后，组件内可通过 `inject('$mussel')` 或 `this.$mussel` 获取上下文：

```javascript
const { rootElement, options, messageBox, setupColors } = inject('$mussel')

messageBox.alert('操作完成')
```

| 属性 | 说明 |
| ---- | ---- |
| rootElement | Element，`root` 解析后的根 DOM 元素 |
| options | Object，传入的 `componentOptions`（剔除 `root`/`dark`/`colors`/`icons`/`locale`/`localeResources` 之后的部分） |
| messageBox | 命令式对话框与通知 API（`alert` / `confirm` / `error` / `warn` / `notify`） |
| setupColors | 主题色设置函数（已绑定到当前上下文），用于运行时换肤，见下文「运行时换肤」 |

### installIcons(icons)

独立注册图标，可在 `install` 之外任意时机补充。值可为 SVG 字符串/数据，或 icon-font 的 class 字符串：

```javascript
import { installIcons } from 'mussel'

installIcons({
  refresh: RefreshIcon,        // svg data
  bolt: 'icon icon-bolt'       // icon-font class
})
```

库还导出内置图标注册表 `icons`（已注册图标的集合，`key → { svg?, cls?, animation? }`），可用于运行时查询可用图标：

```javascript
import { icons } from 'mussel'

Object.keys(icons)  // 列出所有可用图标名
```



## 运行时换肤 — `$mussel.setupColors`

主题色设置函数**挂载在 `$mussel` 上下文上**（非顶层导出），已绑定到当前应用上下文，可在 `install` 之后任意时机调用——运行时换肤、动态切换主题。

```javascript
const { setupColors } = inject('$mussel')

setupColors({ primary: '#be4bdb' })  // 默认写入当前应用根元素
```

| 参数 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| customColors | Object | `{}` | 自定义主题色，key 同 `options.colors`：`primary` / `secondary` / `success` / `warning` / `danger` / `neutral` / `gray`，自动派生调色板与灰阶，并写入 `--mu-*` CSS 变量 |
| rootElement | Element | `$mussel.rootElement` | 写入 CSS 变量的根元素；未传时回退到当前上下文的 `rootElement`，再回退到 `document.body` |

> [!NOTE]
>
> `setupColors` 会把传入色合并到运行时 `colors` 对象并更新根元素的 `--mu-*` 变量。它**只写入 CSS 变量**，不改变 `$mussel.rootElement`。



## 1 - 布局



### MuHBox

水平方向的 Flex 布局容器

> [!NOTE]
>
> 推荐直接使用 `<div class="flex" />`，语义等价且更轻量。



### MuVBox

垂直方向的 Flex 布局容器

> [!NOTE]
>
> 推荐直接使用 `<div class="flex flex-col" />`，语义等价且更轻量。



### MuGridBox

网格布局容器

> [!NOTE]
>
> 推荐直接使用 `<div class="grid">` + 原生 CSS Grid 属性，无需组件。

| 属性名称 | 类型            | 默认值 | 说明                                                                 |
| -------- | --------------- | ------ | -------------------------------------------------------------------- |
| columns  | String \| Number | —      | 列数：数字生成 `repeat(n, 1fr)`；`'auto'` 生成 `grid-auto-columns: 1fr` |
| rows     | String \| Number | —      | 行数：数字生成 `repeat(n, 1fr)`；`'auto'` 生成 `grid-auto-rows: 1fr`    |



### MuGridCell

网格布局单元格容器

| 属性名称   | 类型   | 默认值 | 说明                                                                       |
| ---------- | ------ | ------ | -------------------------------------------------------------------------- |
| col-start  | Number | —      | 起始列                                                                     |
| col-span   | Number | —      | 跨列数                                                                     |
| col-end    | Number | —      | 结束列（实际值为 `colEnd + end-offset`）                                   |
| row-start  | Number | —      | 起始行                                                                     |
| row-span   | Number | —      | 跨行数                                                                     |
| row-end    | Number | —      | 结束行（实际值为 `rowEnd + end-offset`）                                   |
| end-offset | Number | `0`    | 列/行结束偏移量，取值 `0` \| `1`；默认可由全局 `$mussel.options.gridCell.endOffset` 配置 |

```html
<mu-grid-box :columns="6" :rows="6">
  <mu-grid-cell :col-span="2" :row-span="3">宽 2 高 3</mu-grid-cell>
  <mu-grid-cell>默认</mu-grid-cell>
</mu-grid-box>
```



### MuSplitHBox

可拖拽分割的水平弹性布局。面板间由内部 splitter（分隔条）实现拖拽，并可整体收拢。

`left` / `right` 插槽均为可选——省略后不渲染对应面板，因此可灵活组成两区或三区可拖动布局：

```html
<!-- 两区布局：仅 left + center -->
<mu-split-h-box left-width="240px" resizable="left">
  <template #left>导航</template>
  <template #center>主内容</template>
</mu-split-h-box>

<!-- 三区布局：完整 left + center + right -->
<mu-split-h-box left-width="200px" right-width="300px" resizable>
  <template #left>侧边栏</template>
  <template #center>主内容</template>
  <template #right>属性面板</template>
</mu-split-h-box>
```

| 属性名称        | 类型               | 默认值    | 说明                                                                 |
| --------------- | ------------------ | --------- | -------------------------------------------------------------------- |
| resizable       | Boolean \| String  | —         | 可拖拽面板：`true`（两侧）\| `'left'` \| `'right'` \| `false`        |
| collapsible     | Boolean \| String  | —         | 可收拢面板：`true`（两侧）\| `'left'` \| `'right'` \| `false`        |
| splitter-shape  | String             | `'hidden'`| 分隔条形状：`hidden` \| `normal` \| `slim` \| `pill`                 |
| dblclick        | String             | `'reset'` | 双击分隔条行为：`reset`（重置到初始宽度）\| `none`                   |
| left-width      | String             | `'33.3%'` | 左侧面板初始宽度                                                     |
| left-class      | String             | —         | 左侧面板 class                                                       |
| left-style      | Object \| String   | —         | 左侧面板 style                                                       |
| right-width     | String             | `'33.3%'` | 右侧面板初始宽度                                                     |
| right-class     | String             | —         | 右侧面板 class                                                       |
| right-style     | Object \| String   | —         | 右侧面板 style                                                       |
| center-class    | String             | —         | 中间区域 class                                                       |
| center-style    | Object \| String   | —         | 中间区域 style                                                       |

| 插槽名称 | 说明                         |
| -------- | ---------------------------- |
| left     | 左侧面板内容（有插槽时才渲染）|
| center   | 中间内容区                   |
| right    | 右侧面板内容（有插槽时才渲染）|

> [!NOTE]
>
> `collapsible`：拖动至该侧 `min-width` 一半以下即收拢为 0 宽（`display:none`），双击分隔条重置恢复。
>
> 双击分隔条可重置面板尺寸到初始值。



### MuSplitVBox

可拖拽分割的垂直弹性布局，属性语义与 MuSplitHBox 对应（水平方向换为垂直方向）。

```html
<mu-split-v-box top-height="40px" bottom-height="200px" resizable="bottom">
  <template #top>工具栏</template>
  <template #center>主内容</template>
  <template #bottom>日志面板</template>
</mu-split-v-box>
```

| 属性名称        | 类型               | 默认值    | 说明                                                            |
| --------------- | ------------------ | --------- | --------------------------------------------------------------- |
| resizable       | Boolean \| String  | —         | 可拖拽面板：`true`（上下）\| `'top'` \| `'bottom'` \| `false`   |
| collapsible     | Boolean \| String  | —         | 可收拢面板：`true`（上下）\| `'top'` \| `'bottom'` \| `false`   |
| splitter-shape  | String             | `'hidden'`| 分隔条形状：`hidden` \| `normal` \| `slim` \| `pill`            |
| dblclick        | String             | `'reset'` | 双击分隔条行为：`reset`（重置到初始高度）\| `none`              |
| top-height      | String             | `'33.3%'` | 顶部面板初始高度                                                |
| top-class       | String             | —         | 顶部面板 class                                                  |
| top-style       | Object \| String   | —         | 顶部面板 style                                                  |
| bottom-height   | String             | `'33.3%'` | 底部面板初始高度                                                |
| bottom-class    | String             | —         | 底部面板 class                                                  |
| bottom-style    | Object \| String   | —         | 底部面板 style                                                  |
| center-class    | String             | —         | 中间区域 class                                                  |
| center-style    | Object \| String   | —         | 中间区域 style                                                  |

| 插槽名称 | 说明                         |
| -------- | ---------------------------- |
| top      | 顶部面板内容（有插槽时才渲染）|
| center   | 中间内容区                   |
| bottom   | 底部面板内容（有插槽时才渲染）|

> [!NOTE]
>
> 分隔条形状（`splitter-shape`）取值说明：
>
> | 取值    | 说明                                       |
> | ------- | ------------------------------------------ |
> | hidden  | 默认。不占空间、无可见线，但仍可拖拽       |
> | normal  | 常规宽度的分隔线（4px）                    |
> | slim    | 细线（2px）                                |
> | pill    | 不占空间，hover/拖拽时浮现的胶囊把手       |



### MuScrollBox

带非原生渲染滚动条的容器

示例：

```vue
<template>
  <!-- 组件形式，默认自带 overflow: auto -->
  <mu-scroll-box style="height: 400px">内容</mu-scroll-box>

  <!-- 指令形式，为任意容器增加同款滚动条 -->
  <div v-mu-scrollbar style="overflow: auto; height: 400px">内容</div>

  <!-- 指令值为 false 时不渲染滚动条 -->
  <div v-mu-scrollbar="false" style="overflow: auto">内容</div>
</template>
```

> [!NOTE]
>
> 由 `overflow`（及 `-x` / `-y`）样式控制滚动条的显示方向。



### MuToolbar

工具栏，具有特殊样式的 MuBar，常用于页面顶部操作区。

| 属性名称     | 类型   | 默认值  | 说明                                                        |
| ------------ | ------ | ------- | ----------------------------------------------------------- |
| size         | String | `normal`| 工具栏尺寸：`small` \| `normal`（默认）\| `large`；内部按钮默认按此尺寸渲染 |
| button-style | String | `text`  | 内部按钮默认风格：`normal` \| `outline` \| `text` \| `link` |

> [!NOTE]
>
> `MuToolbar` 通过 `provide` 向内部的 `MuButton` / `MuIconButton` / `MuPagination` 注入 `size` 与 `button-style`，作为这些组件未显式设置时的默认值。子组件显式传入对应属性时优先使用自身设置。



## 2 - 容器与面板



### MuTabs

多页签容器

| 属性名称      | 类型   | 说明                                            |
| ------------- | ------ | ----------------------------------------------- |
| active-tab    | String | 双向绑定属性，当前活动页签名称                  |
| tab-style     | String | `button` \| `simple` \| `card` \| `border-card` |
| tab-buttons   | Array  | 页签按钮，默认按内部 tab-panel 组件自动生成     |
| tab-position  | String | `top` \| `bottom` \| `left` \| `right`          |
| bar-size      | String | `normal` \| `small`，控制页签按钮尺寸          |
| tab-bar-attrs | Object | 透传给内置 MuTabBar 的额外属性                  |

| 插槽名称        | 说明                                |
| --------------- | ----------------------------------- |
| tab-bar-prepend | 页签按钮栏前置内容                  |
| tab-bar-append  | 页签按钮栏后置内容（常放置工具按钮）|

| 事件      | 参数   | 说明         |
| --------- | ------ | ------------ |
| tab-click | name   | 页签按钮点击 |

```html
<mu-tabs v-model:active-tab="activeTab" tab-style="button">
  <template #tab-bar-append>
    <mu-icon-button icon="refresh" @click="reload" />
  </template>
  <mu-tab-panel name="list" caption="列表" icon="list">
    <!-- 列表内容 -->
  </mu-tab-panel>
  <mu-tab-panel name="detail" caption="详情" :disabled="!selectedId">
    <!-- 详情内容 -->
  </mu-tab-panel>
</mu-tabs>
```



### MuTabBar

独立使用的页签栏，不含内容区，用于自定义页签 + 内容分离的布局。

| 属性名称    | 类型   | 说明                                            |
| ----------- | ------ | ----------------------------------------------- |
| tab-buttons | Array  | 页签按钮数据（唯一声明的 prop）                 |
| active-tab  | String | 双向绑定（`v-model:active-tab`），当前活动页签 |
| tab-style   | String | 透传：`button` \| `simple`                      |
| tab-position| String | 透传：`top` \| `bottom` \| `left` \| `right`    |

> [!NOTE]
>
> 除 `tab-buttons` 外，`active-tab` 通过 `defineModel` 实现，`tab-style` / `tab-position` 经 `$attrs` 透传给内部按钮渲染，用法上等同于普通 prop。

| 插槽名称 | 说明     |
| -------- | -------- |
| prepend  | 前置内容 |
| append   | 后置内容 |

| 事件      | 参数 | 说明         |
| --------- | ---- | ------------ |
| tab-click | name | 页签按钮点击 |



### MuScrollArea

通用滚动容器，`MuTabBar` 的按钮区即由它实现。内容溢出时不显示滚动条：横向布局在右侧显示左右位移按钮，`vertical` 纵向布局在底部显示上下位移按钮；轻点位移一步，按住连续滚动，到达边界后对应按钮自动禁用。

与 `MuScrollBox`（自定义滚动条容器）的区别：`MuScrollArea` 以位移按钮代替滚动条，适合工具栏、页签栏等单轴排布场景。

| 属性名称 | 类型    | 说明                                             |
| -------- | ------- | ------------------------------------------------ |
| vertical | Boolean | 纵向布局（子项竖排，溢出时底部显示上下位移按钮） |

| 插槽名称 | 说明     |
| -------- | -------- |
| default  | 滚动内容 |



### MuTabPanel

单个页签内容容器，**必须放置于 MuTabs 中**。

| 属性名称  | 类型    | 说明                                             |
| --------- | ------- | ------------------------------------------------ |
| name      | String  | 页签名称，在 Tabs 内唯一（建议必填，用于激活与切换定位）|
| caption   | String  | 对应页签栏按钮的标题                             |
| icon      | String  | 对应页签栏按钮的图标                             |
| title     | String  | 对应页签栏按钮的 tooltip 标题                    |
| disabled  | Boolean | 对应页签的禁用状态                               |
| tab-order | Number  | 手动指定的页签顺序，默认按 DOM 顺序              |



### MuDialog

模态对话框

| 属性名称               | 类型                | 默认值   | 说明                                                                 |
| ---------------------- | ------------------- | -------- | -------------------------------------------------------------------- |
| visible                | Boolean             | —        | 双向绑定可见状态                                                     |
| title                  | String              | —        | 对话框标题                                                           |
| icon                   | String \| Object    | —        | 标题图标                                                             |
| width                  | String \| Number    | —        | 窗口宽度                                                             |
| height                 | String \| Number    | —        | 窗口高度                                                             |
| header                 | `'auto'` \| Boolean | `'auto'` | 头部显隐，`'auto'` 时根据 title/icon/close-button/maximize-button/header slot 自动判断 |
| footer                 | `'auto'` \| Boolean | `'auto'` | 底部显隐，`'auto'` 时根据 buttons/footer slot 自动判断               |
| body-class             | String              | —        | 传给 body 区域的 class                                               |
| body-style             | Object              | —        | 传给 body 区域的 style                                               |
| body-scrollbar         | Boolean             | —        | 为 body 区域启用滚动条（使用 `v-mu-scrollbar`）                      |
| buttons                | Array               | —        | 底部操作按钮，结构见下方                                             |
| dismissible            | Boolean \| String   | —        | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩。不设置则不自动关闭 |
| close-button           | Boolean             | `true`   | 是否显示右上角关闭按钮                                               |
| maximize-button        | Boolean             | —        | 是否显示最大化按钮                                                   |
| maximize-to-fullscreen | Boolean             | —        | 最大化时是否全屏显示                                                 |
| lazy                   | Boolean             | `true`   | 为 true 时，仅首次打开时才渲染对话框内容                             |
| keep-position          | Boolean             | —        | 再次打开时是否保留上次关闭的位置                                     |
| dispose-on-hide        | Boolean             | —        | 隐藏时销毁内容                                                       |
| z-index                | String              | —        | 自定义层级                                                           |
| container              | String \| HTMLElement | —      | 挂载容器。CSS 选择器或 DOM 元素；不设则挂到全局根容器（`$mussel.rootElement`）。设值后遮罩自动改为 `position: absolute`，使弹窗相对该容器而非视口定位 |
| mask-class             | —                   | —        | 遮罩 class                                                           |
| mask-attrs             | Object              | —        | 透传给遮罩的额外属性                                                 |

| 事件           | 参数                                  | 说明                                   |
| -------------- | ------------------------------------- | -------------------------------------- |
| update:visible | value, trigger                        | 可见状态变更。仅关闭时触发（显示由外层 `v-model:visible` 驱动）；`trigger` 表示关闭来源：`'$X'`（右上角关闭按钮）/ `'$ESC'`（ESC 键）/ `'$MASK'`（遮罩点击）/ 按钮的 `name`（如 `'CANCEL'`、`'OK'`） |
| button-click   | button                                | 底部按钮点击，payload 为对象 `{ key, name, caption, action, ...attrs }`；自定义按钮建议用 `name` 字段判断来源 |
| show           | —                                     | 显示时触发                             |
| hide           | —                                     | 隐藏时触发                             |

| 插槽名称 | 说明                                              |
| -------- | ------------------------------------------------- |
| header   | 头部附加内容（插入在标题与系统按钮之间）          |
| body     | 主体内容（推荐使用）                              |
| default  | 主体内容（兼容旧版，`body` slot 存在时忽略）      |
| footer   | 底部附加内容（插入在按钮之前）                    |

**buttons 写法（字符串快速定义 / 对象完整定义）：**

`buttons` 数组每一项既可以是字符串（快速定义），也可以是对象（完整定义）。字符串会按字面量解析：

| 写法 | 含义 |
|------|------|
| `'Find'` | 普通按钮，`name` 与 `caption` 均为该字符串 |
| `'#OK'` \| `'#CANCEL'` \| `'#YES'` \| `'#NO'` \| `'#ACCEPT'` | 内置预设，自动套用主色/文本样式/`action:'close'`/多语言文案 |
| `'#OK!'` \| `'#YES!'` | 同名预设的危险色（红色）变体 |
| `' '`（单个空格） | 弹性间距，把后续按钮推到右侧 |
| `'-'`（连字符） | 分隔线 |
| `{ name, caption, primary, buttonStyle, action, icon, ... }` | 完整对象，可任意覆盖以上字段 |

> `@button-click` 回调收到 `{ name, caption, action, ... }`。**自定义按钮建议显式设 `name`**，再用它判断点击来源——预设按钮的 `name` 固定（如 `'OK'`、`'CANCEL'`）；纯字符串按钮的 `name` 即字符串本身，只要文案稳定也可用，但一旦需要让 `name` 与 `caption` 解耦就必须用对象形式。

**用法示例：封装为独立组件，通过 `show(data)` 显示**

Dialog 通常封装成独立组件：内部维护 `visible`，对外只暴露 `show(data)`，由父组件以 `ref` 调用并传入状态。

`my-dialog.vue`：

```vue
<template>
  <mu-dialog
    ref="dialogRef"
    v-model:visible="visible"
    class="my-dialog"
    title="编辑用户"
    dismissible
    keep-position
    body-class="p-3x"
    :buttons="['-', 'Find', ' ', '#CANCEL', '#OK']"
    @button-click="onButtonClick">
    <mu-form label-width="80px">
      <!-- 表单内容，使用 data -->
    </mu-form>
  </mu-dialog>
</template>

<script setup>
  import { ref } from 'vue'

  const visible = ref(false)
  const data = ref(null)

  function show (value) {
    data.value = value
    visible.value = true
  }

  function onButtonClick (button) {
    // 用 name 判断点击来源
    if (button.name === 'Find') {
      // 自定义按钮：对象形式时 name 来自 { name }，字符串形式时即字符串本身
    } else if (button.name === 'OK') {
      // 预设按钮：'#OK' 的 name 固定为 'OK'
      visible.value = false
    }
  }

  defineExpose({ show })
</script>

<style>
  /* mu-dialog 仅有 width/height 属性，无 min/max 属性；
     覆盖最大/最小尺寸需通过 class（透传到 .mu-dialog 根元素）在样式中设置。 */
  .my-dialog {
    width: 800px;
    min-width: 640px;
    max-width: 90%;
    height: 600px;
    min-height: 480px;
    max-height: 90%;
  }
</style>
```

父组件调用：

```vue
<template>
  <mu-button caption="编辑" @click="open" />
  <my-dialog ref="dialogRef" />
</template>

<script setup>
  import { shallowRef } from 'vue'

  import MyDialog from './my-dialog.vue'

  const dialogRef = shallowRef()

  function open () {
    dialogRef.value?.show({ id: 1, name: 'Tom' })
  }
</script>
```

> [!WARNING]
>
> `easy-hide` / `mask-action` 已废弃，使用 `dismissible`；`moveable` 已移除。



### MuDrawer

可从四周浮出的抽屉面板

| 属性名称  | 类型              | 默认值   | 说明                                                                 |
| --------- | ----------------- | -------- | -------------------------------------------------------------------- |
| visible   | Boolean           | —        | 双向绑定可见状态                                                     |
| position  | String            | `bottom` | 浮出位置：`top` \| `right` \| `bottom` \| `left`                     |
| width     | String \| Number  | —        | 宽度（left/right 时有效）                                            |
| height    | String \| Number  | —        | 高度（top/bottom 时有效）                                            |
| dismissible | Boolean \| String | —      | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩 |
| mask      | Boolean           | `true`   | 是否显示遮罩                                                         |
| rounded   | Boolean           | —        | 是否圆角                                                             |
| teleport  | Boolean           | `true`   | 是否渲染到页面根容器                                                 |
| container | String \| HTMLElement | —      | 挂载容器。CSS 选择器或 DOM 元素；不设则挂到全局根容器（`$mussel.rootElement`）。设值后遮罩自动改为 `position: absolute`，使抽屉相对该容器而非视口定位 |
| lazy      | Boolean           | `true`   | 首次打开时才渲染内容                                                 |
| dispose-on-hide | Boolean      | —        | 隐藏时销毁内容                                                       |
| mask-class| —                 | —        | 遮罩 class                                                           |
| mask-attrs| Object            | —        | 透传给遮罩的额外属性                                                 |

| 事件           | 说明         |
| -------------- | ------------ |
| update:visible | 可见状态变更 |
| show           | 显示时触发   |
| hide           | 隐藏时触发   |

```html
<mu-drawer v-model:visible="drawerVisible" position="right" width="400px" dismissible>
  <div class="flex flex-col" style="height: 100%">
    <div class="flex-none px-2x py-1x border-b border-soft text-normal">详情</div>
    <mu-scroll-box class="flex-1 p-2x">内容区域</mu-scroll-box>
  </div>
</mu-drawer>
```



## 3 - 按钮与操作



### MuButton

各种形态的按钮

| 属性名称     | 类型    | 默认值   | 说明                                              |
| ------------ | ------- | -------- | ------------------------------------------------- |
| caption      | String  | —        | 按钮标题                                          |
| icon         | String  | —        | 按钮图标                                          |
| size         | String  | `normal` | 按钮尺寸：`small` \| `normal` \| `large`          |
| button-style | String  | `normal` | 按钮风格：`normal` \| `outline` \| `text` \| `link` |
| color        | String  | `'normal'`| `'normal'` \| `'primary'` \| `'secondary'` \| `'danger'`，推荐使用 |
| pill         | Boolean | —        | 左右圆弧形态                                      |
| toggle      | Boolean | —        | 开关模式：开启后点击切换 `active`，需配合 `v-model:active` |
| active      | Boolean | —        | 选中状态（`toggle` 开启时双向绑定）               |
| disabled    | Boolean | —        | 禁用状态                                          |

> [!WARNING]
>
> `primary` / `danger` / `secondary` Boolean 属性、`accent`、`x-color` 均已废弃，请使用 `color` 属性。旧文档中的 `round` 已更名为 `pill`。

```html
<mu-button color="primary" caption="保存" icon="save" @click="save" />
<mu-button color="danger" button-style="outline" caption="删除" @click="remove" />
<mu-button button-style="text" caption="取消" @click="cancel" />
```



### MuButtonGroup

按钮组。按钮组的某些外观设置将覆盖其中按钮的设置。

| 属性名称     | 类型    | 说明                                   |
| ------------ | ------- | -------------------------------------- |
| size         | String  | 同 MuButton，覆盖内部按钮尺寸          |
| button-style | String  | 按钮风格：`normal` \| `outline`        |
| primary      | Boolean | 设置整组按钮颜色为主色                 |
| danger       | Boolean | 设置整组按钮颜色为危险色               |
| secondary    | Boolean | 设置整组按钮颜色为次要色               |
| pill         | Boolean | 圆弧形态                               |
| disabled     | Boolean | 禁用整组                               |

```html
<mu-button-group button-style="outline" size="small">
  <mu-button icon="copy" caption="复制" />
  <mu-button icon="cut" caption="剪切" />
  <mu-button icon="paste" caption="粘贴" />
</mu-button-group>
```



### MuIconButton

仅图标的按钮，常用于工具栏或列表项中的快捷操作，不包含文字标题。继承 MuButton 的全部属性。

| 属性名称  | 类型    | 说明                                                |
| --------- | ------- | --------------------------------------------------- |
| icon      | String  | 按钮图标，必填                                      |
| animation | String  | 动画效果                                            |
| (其他)    | —       | 继承 MuButton 属性（`toggle` / `active` / `size` / `color` / `button-style` / `disabled` 等）|

```html
<mu-icon-button icon="refresh" @click="reload" />
<mu-icon-button icon="filter" toggle v-model:active="filterVisible" />
<mu-icon-button icon="chevron-up" button-style="text" @click="scrollTop" />
```



### MuDropdownButton

带下拉菜单的按钮，支持分割按钮形式

| 属性名称    | 类型    | 说明                              |
| ----------- | ------- | --------------------------------- |
| icon        | String  | 按钮图标                          |
| caption     | String  | 按钮文字                          |
| split-button| Boolean | 是否显示为分割按钮                |
| (透传)      | —       | MuButton 属性（`color`、`button-style`、`size` 等）+ MuDropdown 属性 |

```html
<mu-dropdown-button
  caption="新建"
  color="primary"
  split-button
  :dropdown-items="[
    { label: '从模板创建', action: 'from-template' },
    { label: '导入文件',   action: 'import' }
  ]"
  @click="onCreate"
  @action="onDropdownAction"
/>
```



## 4 - 表单



### MuForm

表单容器，支持声明式子组件和 `items` 数组驱动的数据模式。

| 属性名称    | 类型   | 说明                                         |
| ----------- | ------ | -------------------------------------------- |
| model       | Object | 表单数据对象，用于 `items` 模式下的双向绑定  |
| items       | Array  | 表单项定义数组（数据驱动模式），结构见下方   |
| rules       | Object | 表单校验规则，key 为字段名，value 为规则定义 |
| label-width | String | 默认标签宽度（子 MuFormField 继承）          |
| label-align | String | 默认标签对齐：`left` \| `top` \| `right`     |

**items 数组支持的元素类型：**

| 类型     | 写法                  | 说明                                        |
| -------- | --------------------- | ------------------------------------------- |
| 标题     | `'字符串'`            | 渲染为表单分组标题                          |
| 分隔线   | `'hr'`                | 渲染为 `<hr>`                               |
| 换行     | `'->'`                | 渲染为 `flex-break`，强制换行               |
| 子行     | `[...]`               | 数组元素，渲染为一行 MuFormRow              |
| 字段     | `{ prop, label, ... }`| 渲染为 MuFormField，自动绑定 `model[prop]`  |
| 自定义   | `{ is: '组件名', ... }`| 渲染为任意自定义组件                       |

**rules 校验规则格式：**

| 格式   | 示例                           | 说明                                       |
| ------ | ------------------------------ | ------------------------------------------ |
| 字符串 | `'required'`                   | 必填校验                                   |
| 函数   | `(value) => false`             | 自定义校验，返回 `false` 或错误消息字符串  |
| 对象   | `{ required: true, message }`  | 支持更多配置，见下方                       |

**rules 对象属性：**

| 属性            | 类型     | 说明                                                 |
| --------------- | -------- | ---------------------------------------------------- |
| required        | Boolean  | 是否必填                                             |
| validator       | Function | 自定义校验函数 `(value, params) => false \| string` |
| message         | String   | 校验失败时的提示消息                                 |
| requiredMessage | String   | 必填校验失败的提示消息（优先于 message）             |

**方法（通过 ref 调用）：**

| 方法              | 参数 | 返回值                       | 说明                       |
| ----------------- | ---- | ---------------------------- | -------------------------- |
| validate()        | —    | `{ ok: true }` \| `{ errors }` | 校验全部字段               |
| resetValidation() | —    | —                            | 清除所有校验错误状态       |

**数据驱动用法示例：**

```javascript
const form = ref({ name: '', phone: '', birthday: '', memo: '', role: '' })

const rules = {
  name: 'required',
  phone: 'required',
  role: { required: true, message: '请选择角色' }
}

const items = [
  '基本信息',
  { prop: 'name', label: '姓名', width: 1 / 2, required: true },
  { prop: 'phone', label: '手机号', width: 1 / 2 },
  'hr',
  [
    { prop: 'birthday', label: '生日', input: 'date' },
    { prop: 'role', label: '角色', input: {
      type: 'select',
      options: [{ value: 'admin', label: '管理员' }, { value: 'user', label: '用户' }]
    }}
  ],
  { prop: 'memo', label: '备注', input: { type: 'memo', style: 'height: 120px' } }
]
```

```html
<mu-form ref="formRef" :model="form" :items="items" :rules="rules" label-width="80px" label-align="left" />
<mu-button color="primary" caption="提交" @click="formRef.validate()" />
```



### MuFormRow

表单行容器，水平排列多个 MuFormField。支持 `items` 数组。

| 属性名称 | 类型  | 说明                                                       |
| -------- | ----- | ---------------------------------------------------------- |
| items    | Array | 行内字段定义，支持标题、字段、自定义组件（不支持 hr / -> / 子行） |



### MuFormField

表单字段，可自动渲染输入组件或通过 slot 自定义。

| 属性名称    | 类型             | 说明                                             |
| ----------- | ---------------- | ------------------------------------------------ |
| prop        | String           | 对应 model 中的字段名，用于双向绑定              |
| input       | String \| Object | 输入组件配置（见下方 input 配置说明）            |
| label       | String           | 字段标签文字                                     |
| label-width | String           | 覆盖 Form 的标签宽度                             |
| label-align | String           | 覆盖 Form 的标签对齐：`left` \| `top` \| `right` |
| width       | String \| Number | 字段宽度                                         |
| suffix      | String           | 字段后缀文字（如单位）                           |
| required    | Boolean          | 是否必填（添加必填样式并参与表单校验）           |
| error       | String           | 手动设置校验错误信息                             |

**input 配置：**

字符串形式 — 直接指定输入类型，自动渲染对应组件：

| input 值         | 渲染组件                    |
| ---------------- | --------------------------- |
| `'text'`         | mu-input                    |
| `'memo'`         | textarea.mu-input           |
| `'date'`         | mu-date-input               |
| `'week'`         | mu-date-input(type=week)    |
| `'month'`        | mu-date-input(type=month)   |
| `'quarter'`      | mu-date-input(type=quarter) |
| `'year'`         | mu-date-input(type=year)    |
| `'time'`         | mu-time-input               |
| `'color'`        | mu-color-input              |
| `'select'`       | mu-select                   |
| `'multi-select'` | mu-multi-select             |
| `'segmented'`    | mu-segmented                |
| `'check-group'`  | mu-check-group              |
| `'radio-group'`  | mu-radio-group              |

对象形式 — 完整控制组件、属性和绑定行为：

```javascript
{ prop: 'color', label: '颜色', input: {
  type: 'select',
  clearButton: false,
  options: [{ value: 'red', label: '红色' }]
}}
{ prop: 'desc', label: '描述', input: { type: 'memo', style: 'height: 200px' }}
```

**声明式用法：**

```html
<mu-form label-width="100px" label-align="right">
  <mu-form-row>
    <mu-form-field label="姓名">
      <mu-input v-model="form.name" />
    </mu-form-field>
    <mu-form-field label="手机号">
      <mu-input v-model="form.phone" type="tel" />
    </mu-form-field>
  </mu-form-row>
</mu-form>
```



### MuInput

基本输入框

| 属性名称   | 类型             | 默认值 | 说明                                                         |
| ---------- | ---------------- | ------ | ------------------------------------------------------------ |
| modelValue | —                | —      | 双向绑定输入值                                               |
| type       | String           | `text` | 原生 Input 元素的 type                                       |
| placeholder| String           | —      | 占位文本                                                     |
| clearable  | Boolean          | `false` | 是否显示清除按钮（覆盖全局默认值）                                                       |
| size       | String           | —      | 控件尺寸：`small` \| `normal`；置于 `MuToolbar`（`size="small"`）内时自动继承小尺寸，未设置时由上下文决定 |
| pill       | Boolean          | —      | 左右圆弧形态（胶囊形）                                       |
| invalid    | Boolean          | —      | 校验失败样式                                                 |
| readonly   | Boolean          | —      | 是否只读                                                     |
| disabled   | Boolean          | —      | 是否禁用                                                     |
| prefix     | String \| Object | —      | 前置文本或按钮                                               |
| suffix     | String \| Object | —      | 后置文本或按钮                                               |
| tabindex   | String           | `-1`   | 元素 tab 聚焦顺序                                            |

| 事件              | 参数  | 说明                   |
| ----------------- | ----- | ---------------------- |
| update:modelValue | value | 输入值变更事件         |
| input             | Event | 原生 input 事件        |
| focus             | Event | 获焦                   |
| blur              | Event | 失焦                   |
| click             | Event | 点击                   |
| keydown           | Event | 键盘按下               |
| enter             | —     | 回车键（keyCode 13）   |
| esc               | —     | ESC 键（keyCode 27）   |
| prefix-click      | —     | 前置按钮被点击时触发   |
| suffix-click      | —     | 后置按钮被点击时触发   |

> [!NOTE]
>
> 当 MuInput 置于 MuFormField 内部时，表单校验错误状态会自动同步到输入组件的 `invalid` 样式，无需手动设置 invalid 属性。输入值变更时也会自动触发该字段的校验。

> [!WARNING]
>
> `clear-button` 已更名为 `clearable`（现为纯 `Boolean`，不再读取全局 `input.clearButton` 配置）；`label` 已废弃，使用 `prefix` / `suffix`；`solid` / `underline` 已废弃，使用 `input-style`。



### MuSearchInput

带防抖与默认搜索图标的输入框，常作为列表/表格或下拉选项的过滤搜索框

| 属性名称      | 类型             | 默认值         | 说明                                                         |
| ------------- | ---------------- | -------------- | ------------------------------------------------------------ |
| debounce-delay| Number           | `500`          | 值变更后触发 `update:modelValue` 的防抖延迟（毫秒）          |
| prefix        | String \| Object | `':icon=search'`| 默认渲染搜索图标（覆盖 MuInput 默认值）                      |
| clearable     | Boolean          | `true`         | 默认显示清除按钮（覆盖 MuInput 默认值）                      |
| (其他)        | —                | —              | 包含全部 MuInput 属性与事件                                   |

> [!NOTE]
>
> 内部维护即时显示的输入值；`update:modelValue` 仅在用户停止输入 `debounce-delay` 毫秒后（且值确实变化时）才触发，其余事件（`input`、`focus`、`blur`、`enter` 等）即时触发。点击清除按钮会把值置为空字符串 `''`。



### MuInputGroup

输入框组



### MuSelect

下拉单选框，**不需要用户输入时优先使用**。

| 属性名称   | 类型   | 说明                                                         |
| ---------- | ------ | ------------------------------------------------------------ |
| options    | Array  | 下拉选项列表，结构 `[{ label, value }]`                      |
| option-key | String | 下拉选项的 key 属性，默认为 `value`                          |
| value-mode | String | `normal`（默认）\| `composite`（modelValue 为 `{ label, value }`） |
| dropdown-scrollbar | Boolean | 是否渲染下拉面板自定义滚动条，默认 `false`（关闭后由 `mu-scroll-box` 等内部容器负责滚动） |
| (其他)     | —      | 包含全部 MuInput 属性、MuDropdown 中 `dropdown-` 为前缀的属性 |

**带过滤搜索框的下拉列表：** 不使用 `options`，而是通过 `#dropdown` 插槽自定义下拉内容，配合 `mu-search-input`（输入过滤）+ `mu-scroll-box`（滚动容器）+ `mu-option`（选项）实现可搜索列表。

```html
<mu-select
  v-model="selectedItem"
  placeholder="search & select"
  dropdown-class="combo-search-panel flex flex-col gap-half">
  <template #dropdown>
    <mu-search-input
      v-model="searchKey"
      class="flex-none"
      input-style="solid"
      style="width: 100%;" />
    <mu-scroll-box class="flex-1">
      <mu-option
        v-for="el in filteredItems"
        :key="el"
        :value="el" />
    </mu-scroll-box>
  </template>
</mu-select>
```

```javascript
const searchKey = ref('')
const selectedItem = ref()
const items = new Array(50).fill(0).map((el, idx) => `items${idx}`)
const filteredItems = computed(() =>
  items.filter(item => !searchKey.value || item.includes(searchKey.value))
)
```

```css
.combo-search-panel {
  width: 300px;
  max-height: 240px;
}
```

> [!NOTE]
>
> `dropdown-scrollbar` 默认为 `false`，下拉面板不渲染自定义滚动条，由内部的 `mu-scroll-box` 负责滚动；通过 `dropdown-class` 控制面板宽度与最大高度，并用 flex 布局（`mu-search-input` 固定高度 + `mu-scroll-box` 自适应）让搜索框始终置顶。如需 Mussel 自定义滚动条，设置 `:dropdown-scrollbar="true"`。



### MuOption

下拉选项，**必须置于 `mu-select` / `mu-multi-select` / `mu-combo-box` 的 `#dropdown` 插槽内**。作为 `#dropdown` 插槽自定义下拉内容时的选项单元，点击即向父级 select 提交选中并（单选时）关闭面板。

| 属性名称 | 类型   | 说明                                         |
| -------- | ------ | -------------------------------------------- |
| value    | —      | 选项值，必填（选中匹配的依据）               |
| label    | String | 显示文字，缺省时回退到 `value`               |
| icon     | String | 选项前置图标                                 |
| (其他)   | —      | 包含全部 MuDropdownItem 属性                  |

| 插槽名称 | 说明                                                  |
| -------- | ----------------------------------------------------- |
| default  | 自定义选项内容，作用域插槽暴露 `{ selected }`（Boolean） |

> [!NOTE]
>
> - 多选模式（父级为 `mu-multi-select`）下，默认内容会在选中项前显示 check 图标；单选模式不显示。
> - 组件在挂载时向父级 select 注册自身、卸载时注销，因此必须作为上述 select 组件的子节点使用。
> - 当 `mu-select` 通过 `options` 属性渲染时，内部会自动生成 `mu-option`，无需手动编写。



### MuComboBox

组合输入框，支持输入与单选。

| 属性名称 | 类型    | 默认值  | 说明                       |
| -------- | ------- | -------- | -------------------------- |
| editable | Boolean | `false`  | 是否可由用户输入           |
| (其他)   | —       | —        | 包含全部 MuSelect 属性     |

> [!NOTE]
>
> 若无需用户输入，建议使用 MuSelect。
>
> 若设置为可编辑，则不支持选项中的 label 属性，直接使用 value 属性进行显示。



### MuMultiSelect

下拉多选框

| 属性名称    | 类型    | 默认值 | 说明                                                         |
| ----------- | ------- | ------ | ------------------------------------------------------------ |
| max-tags    | Number  | `2`    | 最大显示已选项标签数量，超出部分将合并省略显示               |
| tag-shrink  | Boolean | `true` | 已选标签是否可缩小                                          |
| tag-tooltip | Boolean | `true` | 已选标签是否显示 tooltip                                     |
| disabled    | Boolean | —      | 是否禁用                                                     |
| readonly    | Boolean | —      | 是否只读                                                     |
| (其他)      | —       | —      | 包含全部 MuSelect 属性                                       |



### MuDateInput

日期选择框。下拉面板含工具栏（标题、今天/本周/本月/本季/本年按钮、上下翻页）与对应选择网格。

| 属性名称       | 类型         | 默认值        | 说明                                                  |
| -------------- | ------------ | ------------- | ----------------------------------------------------- |
| model-value    | Date\|String | —             | 双向绑定值（Date 或格式化字符串）                     |
| type           | String       | `date`        | `date`（选日期）\| `week`（选周）\| `month`（选月份）\| `quarter`（选季度）\| `year`（选年份）|
| format         | String       | `null`        | 输入框显示格式；为 `null` 时按 `type` 取默认值（`yyyy-MM-dd` / `yyyy-Www` / `yyyy-MM` / `yyyy-Qq` / `yyyy`） |
| value-type     | String       | `date`        | 返回值类型：`date`（Date 对象）\| `string`（格式化字符串） |
| value-format   | String       | `yyyy-MM-dd`  | 当 `model-value` 为 String 时的输出格式               |
| week-starts-on | Number       | `0`           | 周起始日：`0`=周日 … `6`=周六；影响 `week` 模式的行划分与显示。未单独指定时取全局 `calendar.weekStartsOn` 配置 |
| min            | Date\|String | —             | 最小可选日期                                          |
| max            | Date\|String | —             | 最大可选日期                                          |
| dropdown-class | String       | —             | 下拉面板附加 class                                    |
| (其他)         | —            | —             | 透传 MuInput 属性（`placeholder`/`clearable`/`size`/`prefix`/`suffix`/`disabled`/`readonly` 等）及 MuDropdown 的 `dropdown-` 前缀属性 |

| 事件              | 参数  | 说明                       |
| ----------------- | ----- | -------------------------- |
| update:modelValue | value | 值变更                     |
| dropdown:show     | —     | 下拉面板展开               |
| dropdown:hide     | —     | 下拉面板收起               |
| (其他)            | —     | 透传 MuInput 事件（`focus`/`blur`/`input`/`enter`/`esc`/`click` 等） |

> [!NOTE]
>
> - `type="date"`：默认显示日期网格；点击标题按钮在「日期网格 ↔ 月份网格」间切换（月份网格内可切换十年区间、先选年份再选月），用于快速跨月/跨年跳转；选中日期即提交并关闭
> - `type="week"`：显示日期网格但以**行选**方式选择整周（点击任一单元格选中其所在行），返回该周第一天；若该行第一天属上月则返回当月 1 号。默认显示格式为 ISO 周序号（如 `2026-W29`）；当 `format` 含 `M`（月）时改为当月第几周（如 `2026-07-W3`）
> - `type="month"`：直接进入月份网格（含十年区间年份切换 + 12 月份格），选中月份即提交并关闭
> - `type="quarter"`：进入季度网格（含十年区间年份切换 + 4 季度格），选中季度即提交并关闭
> - `type="year"`：直接进入年份网格（每屏 10 年），选中年份即提交并关闭
> - 顶部上下翻页按钮**仅在日期/周视图**出现，用于翻月；月份/季度/年份视图切换十年区间由面板内部的左右箭头格子完成
> - 「今天/本周/本月/本季/本年」按钮跳回当前并提交，文案随当前视图变化



### MuTimeInput

时间选择框。点击展开下拉面板，内部为「时 / 分 / 秒」三列滚动选择器（始终 24 小时制），底部「确定」按钮提交并关闭。`modelValue` 为 `"HH:mm[:ss]"` 形态的时间字符串。

| 属性名称       | 类型   | 默认值     | 说明                                                  |
| -------------- | ------ | ---------- | ----------------------------------------------------- |
| model-value    | String | —          | 双向绑定值，时间字符串（按 `format` 显示与输出）      |
| format         | String | `HH:mm:ss` | 输入框显示与输出格式，支持 `HH`/`mm`/`ss` 占位符；设为 `'HH:mm'` 即可选到分钟 |
| minute-step    | Number | `5`        | 分钟列步进：`0` \| `1` \| `5` \| `10` \| `15` \| `30`；`0` 时分钟固定为 `00` |
| second-step    | Number | `5`        | 秒列步进，取值同 `minute-step`；`0` 时秒固定为 `00`   |
| dropdown-class | String | —          | 下拉面板附加 class                                    |
| (其他)         | —      | —          | 透传 MuInput 属性（`placeholder`/`clearable`/`size`/`prefix`/`suffix`/`disabled`/`readonly` 等）及 MuDropdown 的 `dropdown-` 前缀属性 |

| 事件              | 参数  | 说明                       |
| ----------------- | ----- | -------------------------- |
| update:modelValue | value | 值变更                     |
| dropdown:show     | —     | 下拉面板展开               |
| dropdown:hide     | —     | 下拉面板收起               |
| (其他)            | —     | 透传 MuInput 事件（`focus`/`blur`/`input`/`enter`/`esc`/`click` 等） |

> [!NOTE]
>
> - 输入框本身不可编辑，时间仅通过下拉面板选择；在面板内滚动或点击数字选中后，点击底部「确定」按钮提交并关闭面板
> - `format` 同时控制显示与输出：设为 `'HH:mm'` 且 `second-step="0"` 即得到「时分」选择器
> - 列项默认按步进 5（0、5、10…55）生成；如需精确到每一分钟/秒，将对应 step 设为 `1`

```html
<mu-time-input v-model="time" placeholder="时分秒" prefix="时间" />
<!-- 时分选择（隐藏秒） -->
<mu-time-input v-model="time" format="HH:mm" :second-step="0" />
<!-- 秒按 15 分步进 -->
<mu-time-input v-model="time" :second-step="15" />
```



### MuColorInput

颜色选择框。前置显示当前色块，右侧为可输入的 HEX 文本框；展开下拉面板显示 Mussel 内置色板（12 色组 + 1 组灰阶，每组 10 级色阶 = 130 色），点击色格即选中。

| 属性名称   | 类型    | 默认值 | 说明                                                                 |
| ---------- | ------- | ------ | -------------------------------------------------------------------- |
| modelValue | String  | —      | 双向绑定值，HEX 字符串（`#RGB` 或 `#RRGGBB`，内部规范化为大写 `#RRGGBB`） |
| placeholder| String  | —      | 占位文本                                                             |
| dropdown-class | String | —     | 下拉面板附加 class                                                   |
| disabled   | Boolean | —      | 是否禁用（透传给内部输入框与色块）                                   |
| readonly   | Boolean | —      | 是否只读（透传给内部输入框与色块）                                   |

| 事件              | 参数 | 说明                       |
| ----------------- | ---- | -------------------------- |
| update:modelValue | hex  | 值变更（HEX 字符串）       |
| dropdown:show     | —    | 下拉面板展开               |
| dropdown:hide     | —    | 下拉面板收起               |

> [!NOTE]
>
> 内置色板由 `colors` 对象派生（12 基础色 + 1 组灰阶，各 10 级色阶），随主题色配置动态变化。HEX 输入框默认大写，允许临时非法值，仅在回车、失焦、ESC（回滚）时规范化提交。在 `MuFormField` 的 `input` 中用 `'color'` 即可数据驱动渲染。



### MuCheck

复选按钮

| 属性名称   | 类型             | 说明                                               |
| ---------- | ---------------- | -------------------------------------------------- |
| modelValue | Boolean \| Array | 双向绑定的输入值                                   |
| value      | —                | 选项值（当输入值是数组时，该选项在数组中的对应值） |
| label      | String           | 标签文字                                           |
| disabled   | Boolean          | 禁用状态                                           |

> [!NOTE]
>
> 可单独使用（`v-model` 绑定 Boolean），也可放在 `<mu-check-group>` 内（`v-model` 绑定 Array）。



### MuCheckGroup

复选按钮组，管理多个 MuCheck 的选中状态

| 属性名称   | 类型    | 说明                                  |
| ---------- | ------- | ------------------------------------- |
| modelValue | Array   | 双向绑定值（选中项 value 数组）       |
| options    | Array   | 选项数组 `[{ value, label, disabled? }]` |
| disabled   | Boolean | 禁用整组                              |

```html
<!-- options 属性 -->
<mu-check-group v-model="checked" :options="options" />

<!-- slot 用法 -->
<mu-check-group v-model="checked">
  <mu-check value="a" label="选项 A" />
  <mu-check value="b" label="选项 B" />
</mu-check-group>
```



### MuRadio

单选按钮

| 属性名称   | 类型    | 说明             |
| ---------- | ------- | ---------------- |
| modelValue | —       | 双向绑定的输入值 |
| value      | —       | 选项值，必填     |
| label      | String  | 标签文字         |
| disabled   | Boolean | 禁用状态         |

> [!NOTE]
>
> 可单独使用，也可放在 `<mu-radio-group>` 内。



### MuRadioGroup

单选按钮组，管理多个 MuRadio 的选中状态

| 属性名称   | 类型    | 说明                                    |
| ---------- | ------- | --------------------------------------- |
| modelValue | —       | 双向绑定值（当前选中项 value）          |
| options    | Array   | 选项数组 `[{ value, label, disabled? }]`|
| disabled   | Boolean | 禁用整组                                |

```html
<!-- options 属性 -->
<mu-radio-group v-model="selected" :options="options" />

<!-- slot 用法 -->
<mu-radio-group v-model="selected">
  <mu-radio value="x" label="Radio X" />
  <mu-radio value="y" label="Radio Y" />
</mu-radio-group>
```



### MuSegmented

分段控件，在多个互斥选项间切换，带滑块动画

| 属性名称      | 类型    | 默认值 | 说明                                                              |
| ------------- | ------- | ------ | ----------------------------------------------------------------- |
| modelValue    | —       | —      | 双向绑定值（当前选中项 value）                                    |
| options       | Array   | —      | 选项数组 `[{ value, label, icon?, disabled? }]` 或简单值 `[1,2,3]` |
| disabled      | Boolean | —      | 禁用整组                                                          |
| icon-position | String  | `left` | 图标位置：`left`（文字左侧）\| `top`（文字上方）                  |

```html
<mu-segmented v-model="viewMode" :options="[
  { value: 'list', label: '列表', icon: 'list' },
  { value: 'grid', label: '网格', icon: 'grid' },
  { value: 'table', label: '表格', icon: 'table' }
]" />

<!-- 简单值形式 -->
<mu-segmented v-model="period" :options="['日', '周', '月', '年']" />

<!-- 图标在上方 -->
<mu-segmented v-model="view" icon-position="top" :options="viewOptions" />
```



### MuSwitch

开关

| 属性名称        | 类型   | 默认值  | 说明                     |
| --------------- | ------ | ------- | ------------------------ |
| modelValue      | —      | —       | 双向绑定的输入值         |
| label           | String | —       | 标签文字                 |
| icon            | String | —       | 图标（两侧均显示）       |
| active-icon     | String | —       | 激活态图标               |
| inactive-icon   | String | —       | 非激活态图标             |
| active-label    | String | —       | 打开状态的标签文字       |
| inactive-label  | String | —       | 关闭状态的标签文字       |
| active-value    | —      | `true`  | 打开状态值               |
| inactive-value  | —      | `false` | 关闭状态值               |



## 5 - 导航与菜单



### MuDropdownPanel

独立下拉面板，作为容器使用，自行管理触发器。

| 属性名称       | 类型    | 默认值  | 说明                                     |
| -------------- | ------- | ------- | ---------------------------------------- |
| width          | String  | —       | 面板宽度                                 |
| height         | String  | —       | 面板高度                                 |
| trigger        | String  | `click` | 显示触发方式：`hover` \| `click`         |
| position       | String  | `auto`  | 弹出位置：`auto` \| `fixed` \| `top` \| `bottom` |
| dropdown-items | Array   | —       | 列表项                                   |
| scrollbar      | Boolean | —       | 是否渲染 Mussel 滚动条                   |

| 事件      | 参数                         | 说明                         |
| --------- | ---------------------------- | ---------------------------- |
| show      | —                            | 面板弹出时触发               |
| hide      | —                            | 面板关闭时触发               |
| action    | action - 下拉项定义的 action | 包含 action 的下拉项点击触发 |
| itemclick | item - 下拉项属性            | 下拉项点击触发               |

| 方法 | 说明     |
| ---- | -------- |
| show | 弹出面板 |
| hide | 关闭面板 |



### MuDropdown

下拉菜单 Mixin，为触发器元素附加下拉能力，属性均以 `dropdown-` 为前缀。

| 属性名称           | 类型    | 说明                                             |
| ------------------ | ------- | ------------------------------------------------ |
| dropdown-items     | Array   | 下拉项列表                                       |
| dropdown-width     | String  | 下拉面板宽度；`'anchor'` 表示与锚点元素同宽（MuSelect 默认即此值）|
| dropdown-height    | String  | 下拉面板高度                                     |
| dropdown-class     | String  | 下拉面板附加 class                               |
| dropdown-style     | Object \| String | 下拉面板附加 style                      |
| dropdown-trigger   | String  | 弹出触发方式，默认 `hover`：`click` \| `hover`   |
| dropdown-position  | String  | 弹出位置：`auto` \| `fixed` \| `top` \| `bottom` |
| dropdown-icon      | String  | 下拉按钮图标，默认为下箭头                       |
| dropdown-disabled  | Boolean | 下拉面板禁用状态                                 |
| dropdown-scrollbar | Boolean | 是否渲染下拉面板自定义滚动条，默认 `false`       |
| dropdown-panel     | Object  | 自定义下拉面板组件（覆盖默认 MuDropdownPanel）   |
| dropdown-attrs     | Object  | 透传给面板的额外属性                             |
| dropdown-anchor    | —       | 下拉面板锚点目标，默认为组件根元素               |

| 事件               | 参数                         | 说明                         |
| ------------------ | ---------------------------- | ---------------------------- |
| action             | action - 下拉项定义的 action | 包含 action 的下拉项点击触发 |
| dropdown:itemclick | item - 下拉项属性            | 下拉项点击触发               |
| dropdown:show      | —                            | 下拉面板弹出时触发           |
| dropdown:hide      | —                            | 下拉面板关闭时触发           |

**dropdown-items 结构：**

```javascript
[
  { label: '编辑', icon: 'edit', action: 'edit' },
  { label: '删除', icon: 'delete', action: 'delete' },
  { is: '-' },  // 分隔线
  { label: '导出', disabled: true }
]
```



### MuDropdownItem

下拉项，下拉面板内的基础菜单项。点击后自动收起面板；若设置了 `action`，面板会额外触发 `action` 事件。

| 属性名称 | 类型    | 说明                                                    |
| -------- | ------- | ------------------------------------------------------- |
| label    | String  | 项文字                                                  |
| icon     | String  | 前置图标                                                |
| action   | —       | 点击时触发的动作标识，由父级下拉面板向上 emit `action`  |
| disabled | Boolean | 是否禁用                                                |

```html
<mu-dropdown-item label="编辑" icon="edit" action="edit" />
<mu-dropdown-item label="导出" disabled />
```



### MuDropdownCheckItem

带勾选框的下拉项，用于多选场景。

| 属性名称 | 类型              | 说明                                                     |
| -------- | ----------------- | -------------------------------------------------------- |
| v-model  | Boolean \| Array  | 选中状态；多选时绑定数组（结合 `value` 标识当前项）      |
| value    | —                 | 当前项标识，多选模式下被收集进 v-model 数组              |
| label    | String            | 项文字；未设置时回退显示 `value`                         |
| icon     | String            | 前置图标                                                 |
| action   | —                 | 点击时触发的动作标识                                     |
| disabled | Boolean           | 是否禁用                                                 |

```html
<!-- 多选：用数组收集各勾选项的 value -->
<mu-dropdown-check-item v-model="checked" value="apple" label="苹果" />
<mu-dropdown-check-item v-model="checked" value="banana" label="香蕉" />
```



### MuDropdownRadioItem

带单选框的下拉项，用于多选一场景。

| 属性名称 | 类型    | 说明                                  |
| -------- | ------- | ------------------------------------- |
| v-model  | —       | 当前选中值，与被选中项的 `value` 匹配 |
| value    | —       | 当前项标识，**必填**                  |
| label    | String  | 项文字；未设置时回退显示 `value`      |
| icon     | String  | 前置图标                              |
| action   | —       | 点击时触发的动作标识                  |
| disabled | Boolean | 是否禁用                              |

```html
<mu-dropdown-radio-item v-model="picked" value="a" label="选项 A" />
<mu-dropdown-radio-item v-model="picked" value="b" label="选项 B" />
```



### MuContextMenu

上下文菜单，在需要的地方弹出。

示例：

```vue
<template>
  <mu-context-menu ref="ctxMenu" :menus="menuItems" @action="onAction" />
  <div @contextmenu.prevent="ctxMenu.show($event)">右键此区域</div>
</template>

<script setup>
const ctxMenu = shallowRef()
</script>
```

| 属性名称 | 类型  | 说明                           |
| -------- | ----- | ------------------------------ |
| menus    | Array | 菜单项列表，结构同 dropdown-items |

事件与方法同 MuDropdownPanel



## 6 - 数据展示



### MuListItem

列表项，用于数据显示或导航，默认外观包含一个图标加标题

| 属性名称 | 类型   | 说明                                          |
| -------- | ------ | --------------------------------------------- |
| icon     | String | 注册的图标名称或者 icon-font class            |
| label    | String | 标题                                          |
| tag      | String | 渲染元素的标签名，默认是 `div`，可选 `a` \| `div` |



### MuListDivider

列表分隔项



### MuTree

树

| 属性名称           | 类型                       | 说明                                      |
| ------------------ | -------------------------- | ----------------------------------------- |
| data               | Array                      | 树节点数据                                |
| props              | Object                     | 树节点数据属性定义                        |
| buttons            | Array                      | 树节点工具按钮                            |
| checkbox           | Boolean                    | 是否显示节点勾选框                        |
| cascaded-check     | Boolean                    | 是否级联勾选                              |
| checked-nodes-keys | Set                        | 已选节点（多）唯一标识                    |
| auto-expand-level  | Number                     | 自动展开层级数                            |
| active-node        | Object \| Number \| String | 当前选中节点                              |
| node-icons         | Boolean \| Object          | 是否显示节点图标 & 自定义图标             |
| expand-icons       | Boolean \| Object          | 是否显示节点展开状态图标 & 自定义展开图标 |

| 事件              | 参数          | 说明                                           |
| ----------------- | ------------- | ---------------------------------------------- |
| node-click        | node          | 节点点击时触发，不含展开按钮和节点工具按钮点击 |
| node-expand       | node          | 节点展开时触发，可用于子节点懒加载             |
| node-collapse     | node          | 节点收拢时触发                                 |
| node-button-click | node, button  | 节点工具按钮点击时触发                         |
| node-check-change | node, checked | 节点勾选状态改变时触发                         |

| 插槽名称 | 说明                              |
| -------- | --------------------------------- |
| default  | 树节点模板，作用域参数为 node     |
| buttons  | 树节点工具模板，作用域参数为 node |



### MuTags

标签组

| 属性名称         | 类型    | 默认值  | 说明                                         |
| ---------------- | ------- | ------- | -------------------------------------------- |
| tags             | Array   | —       | 标签数据                                     |
| max              | Number  | —       | 最大显示标签个数                             |
| removable        | Boolean | —       | 是否可删除                                   |
| expandable       | Boolean | —       | 是否可下拉展开显示所有标签项                 |
| tooltip          | Boolean | `true`  | 是否显示标签标题 tooltip                     |
| dropdown-anchor | —       | 父节点  | 下拉面板锚点目标，默认为当前组件根元素父节点 |

| 事件       | 参数 | 说明                   |
| ---------- | ---- | ---------------------- |
| tag-remove | tag  | 点击标签删除按钮时触发 |



### MuCalendar

月历，用于页面内嵌日期展示与选择

| 属性名称     | 类型            | 默认值        | 说明                                                 |
| ------------ | --------------- | ------------- | ---------------------------------------------------- |
| model-value  | Date \| String  | —             | 双向绑定的日期值                                     |
| value-type   | String          | `date`        | 返回值类型：`date`（Date 对象）\| `string`（格式化字符串） |
| value-format | String          | `yyyy-MM-dd`  | 当 `model-value` 为 String 时的输出格式              |
| week-starts-on | Number        | `0`           | 周起始日：`0`=周日 … `6`=周六。未指定时取全局 `calendar.weekStartsOn` 配置 |
| min          | Date \| String  | —             | 最小可选日期                                         |
| max          | Date \| String  | —             | 最大可选日期                                         |



### MuTable

数据表格，支持多种列类型和交互功能。

| 属性名称             | 类型             | 默认值        | 说明                                              |
| -------------------- | ---------------- | ------------- | ------------------------------------------------- |
| records              | Array            | —             | 数据记录列表                                      |
| columns              | Array            | —             | 列配置列表（详见下文 Column 配置）                |
| key-field            | String           | —             | 记录唯一标识字段名                                |
| striped              | Boolean          | —             | 是否显示斑马纹                                    |
| hover-mode           | String           | —             | 悬停模式：`none` \| `row` \| `column` \| `cross` \| `cell` |
| gridlines            | String           | —             | 网格线：`none` \| `all` \| `row` \| `column`      |
| selected-record      | Object           | —             | 当前选中记录（双向绑定）                          |
| selected-record-key  | String \| Number | —             | 当前选中记录的 key（双向绑定）                    |
| header-checked       | Object           | —             | check 列头部全选状态（双向绑定），结构 `{ [field]: boolean }` |
| order-by             | String           | —             | 排序字段，格式 `field:asc` / `field:desc`         |
| records-offset       | Number           | —             | 记录偏移量，用于计算行号                          |
| fixed-left-columns   | Number           | —             | 固定左侧列数                                      |
| virtual-scroll       | Boolean          | —             | 虚拟滚动（大数据量时使用）                        |
| placeholder          | String           | —             | 空单元格占位文本                                  |

| 事件                       | 参数                               | 说明                       |
| -------------------------- | ---------------------------------- | -------------------------- |
| header-click               | column                             | 表头点击                   |
| cell-click                 | { record, recordIndex, column }    | 单元格点击                 |
| cell-item-click            | { record, column, link/tag }       | 单元格内项目点击（链接/标签） |
| update:header-checked      | checked                            | check 列头部全选状态变更   |
| update:selected-record     | record                             | 选中记录变更               |
| update:selected-record-key | key                                | 选中记录 key 变更          |
| update:cell-value          | { record, column, value }          | 单元格值变更（check 列）   |

#### Column 配置

| 属性名称       | 类型                | 说明                                       |
| -------------- | ------------------- | ------------------------------------------ |
| field          | String              | 数据字段名                                 |
| caption        | String              | 列标题                                     |
| type           | String              | 列类型（见下文 Column Types）              |
| width          | String \| Number    | 列宽                                       |
| minWidth       | String \| Number    | 最小列宽                                   |
| maxWidth       | String \| Number    | 最大列宽                                   |
| align          | String              | 对齐方式：`left` \| `center` \| `right`    |
| sortable       | Boolean             | 是否可排序                                 |
| text           | String \| Function  | 单元格显示文本（可覆盖默认值）             |
| value          | String \| Function  | 单元格值（可覆盖 field）                   |
| title          | String \| Function  | 单元格 title                               |
| class          | String \| Function  | 单元格 class                               |
| style          | String \| Function  | 单元格样式                                 |
| headerClass    | String \| Function  | 表头 class                                 |
| headerStyle    | String \| Function  | 表头样式                                   |
| multiline      | Boolean             | 多行文本（text 类型）                      |
| lineClamp      | Number \| Function  | 文本行数限制（text 类型）                  |
| mappings       | Object              | 值映射（`enum` / `bool` 类型）             |
| format         | String              | 日期格式（`date` / `datetime` 类型）       |
| formatOption   | Object              | 格式化选项（`number` / `currency` 类型）   |
| links          | Function            | 链接生成函数（`link` 类型），返回链接数组  |
| linkOption     | Object              | `{ max, class, style, danger, disabled }`  |
| tags           | Function            | 标签生成函数（`tag` 类型），返回标签数组   |
| tagOption      | Object              | `{ max, class, style, pill, flat, color }` |
| disabled       | Function            | 禁用函数（`check` 类型）                   |
| headerCheckbox | Boolean             | 是否显示头部全选勾选框（`check` 类型）     |

#### Column Types

| 类型      | 说明                | 默认对齐 | 默认宽度 |
| --------- | ------------------- | -------- | -------- |
| text      | 文本列              | left     | -        |
| rec_no    | 行号列              | center   | 50px     |
| check     | 复选勾选列          | center   | 50px     |
| bool      | 布尔值（是/否）     | center   | -        |
| enum      | 枚举值映射          | center   | -        |
| date      | 日期                | right    | -        |
| datetime  | 日期时间            | right    | -        |
| number    | 数字                | right    | -        |
| currency  | 货币                | right    | -        |
| link      | 链接                | left     | -        |
| tag       | 标签                | left     | -        |
| img/image | 图片                | left     | -        |

**列类型详细说明：**

- **text**：文本列，支持 `multiline` 多行显示和 `lineClamp` 行数限制
- **rec_no**：自动显示行号，从 `records-offset + 1` 开始
- **check**：复选列，支持单个勾选和头部全选，通过 `update:cell-value` 事件获取变更
- **bool**：布尔值，通过 `mappings` 配置显示文本，默认 `{ true: '是', false: '否' }`
- **enum**：枚举值映射，通过 `mappings` 配置值与显示文本的对应关系
- **date/datetime**：日期格式化，通过 `format` 指定格式，默认 `yyyy-MM-dd` / `yyyy-MM-dd hh:mm`
- **number/currency**：数字格式化，使用 `Intl.NumberFormat`，支持 `formatOption` 配置
- **link**：链接列，通过 `links` 函数生成链接数组，支持 `max` 限制显示数量
- **tag**：标签列，通过 `tags` 函数生成标签数组，支持 `max` 限制显示数量
- **img/image**：图片列，显示图片缩略图

**示例：**

```vue
<template>
  <mu-table
    :records="records"
    :columns="columns"
    key-field="id"
    striped
    hover-mode="row"
    v-model:selected-record-key="selectedKey"
    @cell-item-click="onItemClick"
  />
</template>

<script setup>
import { ref } from 'vue'

const selectedKey = ref(null)

const columns = [
  { type: 'rec_no' },
  { type: 'check', field: 'checked', headerCheckbox: true },
  { field: 'name',    caption: '姓名',   type: 'text', sortable: true },
  { field: 'amount',  caption: '金额',   type: 'currency' },
  { field: 'status',  caption: '状态',   type: 'enum',
    mappings: {
      active:   { text: '启用', class: 'mu-tag--success' },
      inactive: { text: '停用', class: 'mu-tag--danger' }
    }
  },
  { field: 'created', caption: '创建时间', type: 'date', format: 'yyyy-MM-dd' },
  { field: 'actions', caption: '操作',   type: 'link',
    linkOption: { max: 3 },
    links: (record) => [
      { caption: '编辑', action: 'edit' },
      { caption: '删除', action: 'delete', danger: true }
    ]
  }
]
</script>
```



### MuPagination

分页组件，常与 `MuTable` 配合使用（作为表格的平级兄弟节点，置于表格下方）。

| 属性名称           | 类型    | 默认值 | 说明                                                         |
| ------------------ | ------- | ------ | ------------------------------------------------------------ |
| page-index         | Number  | `0`    | 双向绑定，当前页码（从 0 开始）                              |
| page-size          | Number  | `20`   | 双向绑定，每页条数                                           |
| total              | Number  | `0`    | 记录总数（总页数由 `total / page-size` 派生）                |
| page-size-options  | Array   | —        | 可选每页条数，如 `[20, 50, 100]`；提供后渲染下拉切换           |
| size               | String  | `normal` | 工具栏尺寸：`small` \| `normal`（默认）；控制内部按钮尺寸      |
| button-style       | String  | `text`   | 内部按钮风格：`normal` \| `outline` \| `text` \| `link`        |
| quick-jumper       | Boolean | —      | 是否显示快速跳页输入框                                       |

| 事件                | 参数      | 说明               |
| ------------------- | --------- | ------------------ |
| update:page-index   | pageIndex | 页码变更           |
| update:page-size    | pageSize  | 每页条数变更       |

> [!WARNING]
>
> 早期版本的 `offset` / `limit` / `data-count` / `page-count` / `eof` / `disabled` props 已移除，统一为 `page-index` / `page-size` / `total` 模型。

```html
<mu-table :records="records" :columns="columns" />
<mu-pagination
  v-model:page-index="pageIndex"
  v-model:page-size="pageSize"
  :total="total"
  :page-size-options="[20, 50, 100]"
  size="small"
  quick-jumper
  class="mt-1x" />
```

> [!NOTE]
>
> `MuPagination` 自身具备工具栏行为：内部会向自己的按钮（`mu-button` / `mu-icon-button` / `mu-dropdown-button`）注入 `size` 与 `button-style`，效果与放在 `<mu-toolbar>` 内一致，因此通常无需再外层包裹 `<mu-toolbar>`。



## 7 - 反馈



### MessageBox

命令式消息对话框，通过 `inject('$mussel')` 调用。

示例：

```vue
<script setup>
import { inject } from 'vue'

const { messageBox } = inject('$mussel')

messageBox.alert('操作完成')
messageBox.confirm('确认删除该记录？').then(btn => {
  if (btn === 'OK') doDelete()
})
messageBox.error('服务器异常，请稍后重试')
messageBox.warn('此操作不可撤销，请确认')
</script>
```



### Notifier

浮动消息提示，通过 `inject('$mussel')` 调用。

```vue
<script setup>
import { inject } from 'vue'

const { messageBox } = inject('$mussel')

messageBox.notify({
  title: '保存成功',
  message: '记录已更新',
  type: 'success'   // alert | success | warn | error
})
</script>
```



### MuStatusBox

状态显示面板，用于空状态、加载失败、无权限等场景

| 属性名称 | 类型              | 说明     |
| -------- | ----------------- | -------- |
| icon     | String            | 状态图标 |
| title    | String            | 状态标题 |
| message  | String            | 补充说明 |
| width    | String \| Number  | 宽度     |
| height   | String \| Number  | 高度     |

| 插槽名称 | 说明                   |
| -------- | ---------------------- |
| default  | 自定义内容（如操作按钮）|
| icon     | 自定义图标（图片形式） |

```html
<!-- 空状态 -->
<mu-status-box icon="empty" title="暂无数据" message="请调整筛选条件后重试">
  <mu-button button-style="outline" caption="重置筛选" @click="resetFilter" />
</mu-status-box>

<!-- 加载失败 -->
<mu-status-box icon="error" title="加载失败" message="请检查网络后重试">
  <mu-button color="primary" caption="重新加载" @click="reload" />
</mu-status-box>
```



## 8 - 基础元素



### MuIcon

图标，支持 svg 和 icon-font class。

建议在使用前集中注册图标，便于管理应用所用图标：

```javascript
import { install as installMussel, installIcons } from 'mussel'
import EditIcon from '@/assets/icons/edit.svg'

// 安装时注册
installMussel(app, {
  icons: {
    edit: EditIcon,            // svg data
    bolt: 'icon icon-bolt'     // icon-font class
  }
})

// 或在其他时候补充注册
installIcons({ refresh: RefreshIcon })
```

| 属性名称 | 类型   | 说明                                            |
| -------- | ------ | ----------------------------------------------- |
| icon     | String | 已注册的 icon 名称，或以 `.` 开头的 icon-font class |
| tag      | String | 渲染的图标 DOM tagName，默认是 `span`           |

```html
<mu-icon icon="edit" />
<mu-icon icon=".icon icon-bolt" />
```



### MuBadge

徽章，可用作标签或角标显示。

颜色变体通过 HTML attribute（非 prop）控制，直接写在标签上即可：

| Attribute | 颜色 |
| --------- | ---- |
| （无）    | 默认灰色（`--mu-gray`） |
| primary   | 主色 |
| secondary | 次要色 |
| success   | 成功色 |
| warning   | 警告色 |
| danger    | 危险色 |

> [!NOTE]
>
> 空内容时渲染为小圆点（8px），背景自动使用 `--mu-danger-color`。

```html
<mu-badge primary>主要</mu-badge>
<mu-badge success>已完成</mu-badge>
<mu-badge danger>异常</mu-badge>
<mu-badge />               <!-- 小红点 -->
```
