# MUSSEL 4 - 原子样式



## 1 - 变量



### 1.1 基本颜色

| 变量名称         | 说明                           |
| ---------------- | ------------------------------ |
| --mu-red         | 红色                           |
| --mu-pink        | 粉色                           |
| --mu-grape       | 葡萄紫                         |
| --mu-violet      | 紫罗兰                         |
| --mu-indigo      | 靛蓝                           |
| --mu-blue        | 蓝色                           |
| --mu-cyan        | 青绿色                         |
| --mu-teal        | 蓝绿色                         |
| --mu-green       | 绿色                           |
| --mu-lime        | 青柠色                         |
| --mu-yellow      | 黄色                           |
| --mu-orange      | 橙色                           |
| --mu-gray        | 灰色，默认是由主色计算的中性色 |
| --mu-gray-(0~19) | 由浅到深的灰色，共 20 个       |



### 1.2 扩展颜色

| 变量名称                   | 说明                      |
| -------------------------- | ------------------------- |
| --mu-primary-color         | 主色，默认取 blue         |
| --mu-primary-color-(0~9)   | 由浅到深的主色，共 10 个  |
| --mu-secondary-color       | 次要色                    |
| --mu-secondary-color-(0~9) | 由浅到深的次要色，共 10 个 |
| --mu-success-color         | 成功信息色，默认取 green  |
| --mu-success-color-(0~9)   | 由浅到深的成功色，共 10 个 |
| --mu-warning-color         | 警告色，默认取 orange     |
| --mu-warning-color-(0~9)   | 由浅到深的警告色，共 10 个 |
| --mu-danger-color          | 危险色，默认取 red        |
| --mu-danger-color-(0~9)    | 由浅到深的危险色，共 10 个 |



### 1.3 透明色

基本色和扩展色均提供 `-translucent` 变体，为对应颜色的 10% 透明度版本。

| 变量名称                 | 说明         |
| ------------------------ | ------------ |
| --mu-gray-translucent    | 灰色透明变体 |
| --mu-red-translucent     | 红色透明变体 |
| --mu-pink-translucent    | 粉色透明变体 |
| --mu-grape-translucent   | 葡萄紫透明变体 |
| --mu-violet-translucent  | 紫罗兰透明变体 |
| --mu-indigo-translucent  | 靛蓝透明变体 |
| --mu-blue-translucent    | 蓝色透明变体 |
| --mu-cyan-translucent    | 青绿色透明变体 |
| --mu-teal-translucent    | 蓝绿色透明变体 |
| --mu-green-translucent   | 绿色透明变体 |
| --mu-lime-translucent    | 青柠色透明变体 |
| --mu-yellow-translucent  | 黄色透明变体 |
| --mu-orange-translucent  | 橙色透明变体 |
| --mu-primary-translucent   | 主色透明变体   |
| --mu-secondary-translucent | 次要色透明变体 |
| --mu-success-translucent   | 成功色透明变体 |
| --mu-warning-translucent   | 警告色透明变体 |
| --mu-danger-translucent    | 危险色透明变体 |



### 1.4 浅色

扩展色提供 `-faint` 极浅版本。

| 变量名称               | 说明         |
| ---------------------- | ------------ |
| --mu-primary-faint     | 主色极浅版本   |
| --mu-secondary-faint   | 次要色极浅版本 |
| --mu-success-faint     | 成功色极浅版本 |
| --mu-warning-faint     | 警告色极浅版本 |
| --mu-danger-faint      | 危险色极浅版本 |



### 1.5 文本颜色

| 变量名称                | 说明（由深到浅排列）                     |
| ----------------------- | ---------------------------------------- |
| --mu-text-color-strong  | 清晰，常用于用户输入文本或者文章正文显示 |
| --mu-text-color-normal  | 常规，常用于各类名称显示                 |
| --mu-text-color-subtle  | 次要，用于次级文字信息显示               |
| --mu-text-color-soft    | 柔和，常用于副标题或提示类文字的显示     |
| --mu-text-color-muted   | 淡雅，常用于被 disabled 的组件文字       |



### 1.6 背景颜色

| 变量名称        | 说明                                                       |
| --------------- | ---------------------------------------------------------- |
| --mu-bg-normal  | 默认背景                                                   |
| --mu-bg-strong  | 强调区域背景，比如用作导航区域，或者头、尾的工具栏的背景等 |
| --mu-bg-fill    | 填充背景，如分段控件底色、区块内嵌容器等                   |
| --mu-bg-stripe  | 条纹行背景，用于表格交替行等                               |
| --mu-bg-disabled| 禁用组件的背景                                             |
| --mu-bg-mask    | 遮罩层默认背景                                             |
| --mu-bg-overlay | 弹出层、覆盖物的默认背景                                   |

> `--mu-bg-header` 和 `--mu-bg-footer` 在老版本中存在，4.0 已移除，统一使用 `--mu-bg-strong`。



### 1.7 边框颜色

| 变量名称                 | 说明                         |
| ------------------------ | ---------------------------- |
| --mu-border-color-strong | 较深的边框颜色               |
| --mu-border-color-normal | 正常的边框颜色               |
| --mu-border-color-soft   | 较浅的边框颜色，常用作分隔线 |



### 1.8 边框弧度

| 变量名称                  | 说明                               |
| ------------------------- | ---------------------------------- |
| --mu-common-border-radius | 一般组件边框弧度                   |
| --mu-window-border-radius | 窗口边框弧度，也可用于各类浮出面板 |



### 1.9 文字尺寸

| 变量名称                | 说明                                                |
| ----------------------- | --------------------------------------------------- |
| --mu-font-sans          | 无衬线字体族                                        |
| --mu-font-mono          | 等宽字体族                                          |
| --mu-font-size-normal   | 普通文字尺寸，用于大部分组件的标题文字，默认值 14px |
| --mu-font-size-small    | 小号文字尺寸，默认值 12px                           |
| --mu-font-size-large    | 大号文字尺寸，默认值 16px                           |

> 老版本使用 `--mu-common-font-size`，4.0 已统一为 `--mu-font-size-normal`。



### 1.10 间距

| 变量名称             | 说明                       |
| -------------------- | -------------------------- |
| --mu-base-spacing    | 布局间距基准值，默认值 8px |
| --mu-content-spacing | 行内元素间距。默认值 5px   |



### 1.11 阴影

| 变量名称          | 说明（阴影由浅到深排列）           |
| ----------------- | ---------------------------------- |
| --mu-shadow-focus | 焦点输入元素阴影                   |
| --mu-shadow-float | 突出元素阴影                       |
| --mu-shadow-popup | 弹出元素阴影，如下拉框、消息提示等 |
| --mu-shadow-layer | 浮动层元素阴影，如抽屉面板等       |
| --mu-shadow-modal | 模态窗口阴影                       |



### 1.12 Z-INDEX

| 变量名称           | 说明                                 |
| ------------------ | ------------------------------------ |
| --mu-z-index-float | 突出元素层级                         |
| --mu-z-index-layer | 浮动层层级                           |
| --mu-z-index-modal | 模态窗口层级                         |
| --mu-z-index-popup | 弹出元素层级                         |
| --mu-z-index-ontop | 置顶层级，如消息提示、全局等待动画等 |



### 1.13 控件尺寸

| 变量名称            | 说明         | 默认值 |
| ------------------- | ------------ | ------ |
| --mu-control-height-normal | 默认控件高度 | 32px   |
| --mu-control-height-small | 小尺寸控件高度 | 24px |
| --mu-control-height-large | 大尺寸控件高度 | 40px |

> 老版本使用 `--mu-input-size`，4.0 已统一为 `--mu-control-height-*`。



## 2 - 原子类

### 2.1 定位与布局

**定位：**

| 类名              | 说明             |
| ----------------- | ---------------- |
| .static           | position: static |
| .fixed            | position: fixed  |
| .absolute         | position: absolute |
| .relative         | position: relative |
| .sticky           | position: sticky |



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
| .flex-1       | flex: 1        |
| .flex-2 ~ .flex-8 | flex: 2 ~ flex: 8 |
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

可用值：center, start, end, baseline, stretch, flex-start, flex-end, unset, inherit

**justify-content：**

| 类名             | 说明             |
| ---------------- | ---------------- |
| .justify-{value} | justify-content  |

可用值：start, end, left, right, baseline, center, stretch, flex-start, flex-end, space-around, space-between, space-evenly


**Gap：**

| 类名       | 说明                     |
| ---------- | ------------------------ |
| .gap-none  | gap: unset               |
| .gap-{n}x  | gap: n * 8px             |

**Z-index 定位：**

| 类名       | 说明                              |
| ---------- | --------------------------------- |
| .z-float   | z-index: var(--mu-z-index-float)  |
| .z-layer   | z-index: var(--mu-z-index-layer)  |
| .z-modal   | z-index: var(--mu-z-index-modal)  |
| .z-popup   | z-index: var(--mu-z-index-popup)  |
| .z-ontop   | z-index: var(--mu-z-index-ontop)  |



**Flex 辅助元素：**

| 类名                                | 说明                                          |
| ----------------------------------- | --------------------------------------------- |
| .flex-space                        | 弹性占位，flex: 1 1 0                        |
| .flex-space[space="1x"] ~ [space="4x"] | 等间距变体，flex: 0 0 (n × 8px)              |
| .flex-divider                       | 垂直分隔线，flex: 0 0 2px，默认浅色背景       |
| .flex-divider[line-width="1"] ~ [line-width="4"] | 分隔线宽度，1 ~ 4px                         |
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



### 2.2 间距

间距基于 `--mu-base-spacing`（默认 8px）的倍数，支持 1x ~ 4x。

**padding (n: 1 ~ 4)：**

| 类名       | 说明                     |
| ---------- | ------------------------ |
| .p-{n}x    | 上下左右 padding         |
| .px-{n}x   | 水平方向 padding         |
| .py-{n}x   | 垂直方向 padding         |
| .pt-{n}x   | padding-top              |
| .pr-{n}x   | padding-right            |
| .pb-{n}x   | padding-bottom           |
| .pl-{n}x   | padding-left             |

**margin (n: 1 ~ 4)：**

| 类名       | 说明                     |
| ---------- | ------------------------ |
| .m-{n}x    | 上下左右 margin          |
| .mx-{n}x   | 水平方向 margin          |
| .my-{n}x   | 垂直方向 margin          |
| .mt-{n}x   | margin-top               |
| .mr-{n}x   | margin-right             |
| .mb-{n}x   | margin-bottom            |
| .ml-{n}x   | margin-left              |
| .m-auto    | margin: auto             |
| .mx-auto   | 水平方向 margin: auto    |
| .my-auto   | 垂直方向 margin: auto    |
| .mt-auto   | margin-top: auto         |
| .mr-auto   | margin-right: auto       |
| .mb-auto   | margin-bottom: auto      |
| .ml-auto   | margin-left: auto        |



### 2.3 背景与边框

**背景颜色：**

| 类名              | 说明             |
| ----------------- | ---------------- |
| .bg-normal        | 默认背景色       |
| .bg-strong        | 强调区域背景色   |
| .bg-disabled      | 禁用状态背景色   |
| .bg-overlay       | 弹出层背景色     |
| .bg-mask          | 遮罩层背景色     |

**阴影：**

| 类名                     | 说明                 |
| ------------------------ | -------------------- |
| .mu-shadow-float         | 突出元素阴影         |
| .mu-shadow-popup         | 弹出元素阴影         |
| .mu-shadow-layer         | 浮动层阴影           |
| .mu-shadow-modal         | 模态窗口阴影         |
| .mu-shadow-focus         | 焦点阴影（需 :focus）  |
| .mu-shadow-focus-within  | 焦点阴影（需 :focus-within） |

**边框宽度 (n: 1 ~ 4, 像素值)：**

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

| 类名             | 说明               |
| ---------------- | ------------------ |
| .border-soft     | 浅色边框           |
| .border-strong   | 深色边框           |
| .border-primary  | 主色边框           |
| .border-danger   | 危险色边框         |

**边框样式：**

| 类名             | 说明             |
| ---------------- | ---------------- |
| .border-dashed   | 虚线边框         |
| .border-dotted   | 点线边框         |
| .border-double   | 双线边框         |


### 2.4 文本排版

**文本颜色：**

**中性文本颜色：**

| 类名                    | 变量名                     | 说明                           |
| ----------------------- | -------------------------- | ------------------------------ |
| .text-strong            | --mu-text-color-strong     | 清晰，常用于用户输入或文章正文 |
| .mu-text-color-strong   | --mu-text-color-strong     | 同上                           |
| .text-normal            | --mu-text-color-normal     | 常规，常用于各类名称显示       |
| .mu-text-color-normal   | --mu-text-color-normal     | 同上                           |
| .text-subtle            | --mu-text-color-subtle     | 次要，用于次级文字信息显示     |
| .mu-text-color-subtle   | --mu-text-color-subtle     | 同上                           |
| .text-soft              | --mu-text-color-soft       | 柔和，常用于副标题或提示文字   |
| .mu-text-color-soft     | --mu-text-color-soft       | 同上                           |
| .text-muted             | --mu-text-color-muted      | 淡雅，常用于禁用组件文字       |
| .mu-text-color-muted    | --mu-text-color-muted      | 同上                           |

**功能色文本颜色：**

| 类名                    | 变量名                   | 说明       |
| ----------------------- | ------------------------ | ---------- |
| .text-primary           | --mu-primary-color       | 主色文本   |
| .mu-text-color-primary  | --mu-primary-color       | 同上       |
| .text-secondary         | --mu-secondary-color     | 次要色文本 |
| .mu-text-color-secondary | --mu-secondary-color     | 同上       |
| .text-success           | --mu-success-color       | 成功色文本 |
| .mu-text-color-success  | --mu-success-color       | 同上       |
| .text-warning           | --mu-warning-color       | 警告色文本 |
| .mu-text-color-warning  | --mu-warning-color       | 同上       |
| .text-danger            | --mu-danger-color        | 危险色文本 |
| .mu-text-color-danger   | --mu-danger-color        | 同上       |

**文本对齐：**

| 类名       | 说明               |
| ---------- | ------------------ |
| .text-left | text-align: left   |
| .text-center | text-align: center |
| .text-right | text-align: right  |

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
| .mu-text-ellipsis     | 同上                     |

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

使用方式：通过设置 `--line-clamp` CSS 变量来控制显示行数。

实现方式：
```css
overflow: hidden;
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: var(--line-clamp);
white-space: pre-line;
```

**标签样式：**

| 类名       | 说明                     |
| ---------- | ------------------------ |
| .mu-label  | 固定样式的表单标签（灰色 500、加粗、单行省略、最小宽度 20px） |
