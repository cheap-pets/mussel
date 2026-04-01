# MUSSEL 4 - 样式



## 1 - 变量



### 1.1 基本颜色

| 变量名称        | 说明                           |
| --------------- | ------------------------------ |
| --mu-red        | 红色                           |
| --mu-pink       | 粉色                           |
| --mu-grape      | 葡萄紫                         |
| --mu-violet     | 紫罗兰                         |
| --mu-indigo     | 靛蓝                           |
| --mu-blue       | 靛蓝                           |
| --mu-cyan       | 青绿色                         |
| --mu-teal       | 蓝绿色                         |
| --mu-green      | 绿色                           |
| --mu-lime       | 青柠色                         |
| --mu-yellow     | 黄色                           |
| --mu-orange     | 橙色                           |
| --mu-gray       | 灰色，默认是由主色计算的中性色 |
| --mu-gray-(0~9) | 由浅到深的灰色，共 10 个       |



### 1.2 扩展颜色

| 变量名称                 | 说明                        |
| ------------------------ | --------------------------- |
| --mu-primary-color       | 主色，默认取 blue           |
| --mu-primary-color-(0~9) | 由浅到深的主色，共 10 个    |
| --mu-success-color       | 成功信息色，默认取 green    |
| --mu-success-color-(0~9) | 由浅到深的成功色，共 10 个  |
| --mu-warning-color       | 警告色，默认取 orange       |
| --mu-warning-color-(0~9) | 由浅到深的警告色，共 10 个  |
| --mu-danger-color        | 危险色，默认取 red          |
| --mu-danger-color-(0~9)  | 由浅到深的危险色，共 10 个  |
| --mu-accent-color        | 强调色，取 primary 的对比色 |
| --mu-accent-color-(0~9)  | 由浅到深的强调色，共 10 个  |



### 1.3 文本颜色

| 变量名称               | 说明（由深到浅排列）                     |
| ---------------------- | ---------------------------------------- |
| --mu-text-color-strong  | 清晰，常用于用户输入文本或者文章正文显示 |
| --mu-text-color-normal | 常规，常用于各类名称显示                 |
| --mu-text-color-soft   | 柔和，常用语副标题或提示类文字的显示     |
| --mu-text-color-muted  | 淡雅，常用于被 disabled 的组件文字       |
| --mu-text-color-weak   | 微弱，常用于占位文本显示                 |



### 1.4 背景颜色

| 变量名称                    | 说明                                                       |
| --------------------------- | ---------------------------------------------------------- |
| --mu-bg-normal              | 默认背景                                                   |
| --mu-bg-strong              | 强调区域背景，比如用作导航区域，或者头、尾的工具栏的背景等 |
| --mu-bg-marked              | 标记元素的背景，比上边的更深一点                           |
| --mu-bg-disabled            | 禁用组件的背景                                             |
| --mu-bg-mask                | 遮罩层默认背景                                             |
| --mu-bg-overlay             | 弹出层、覆盖物的默认背景                                   |
| --mu-bg-translucent-gray    | 浅且透明的灰                                               |
| --mu-bg-translucent-primary | 浅且透明的主色                                             |
| --mu-bg-translucent-success | 浅且透明的成功色                                           |
| --mu-bg-translucent-warning | 浅且透明的警告色                                           |
| --mu-bg-translucent-danger  | 浅且透明的危险色                                           |
| --mu-bg-translucent-accent  | 浅且透明的强调色                                           |



### 1.5 边框颜色

| 变量名称                | 说明                         |
| ----------------------- | ---------------------------- |
| --mu-border-color       | 正常的边框颜色               |
| --mu-border-color-soft | 较浅的边框颜色，常用作分隔线 |



### 1.6 边框弧度

| 变量名称                  | 说明                               |
| ------------------------- | ---------------------------------- |
| --mu-common-border-radius | 一般组件边框弧度                   |
| --mu-window-border-radius | 窗口边框弧度，也可用于各类浮出面板 |



### 1.7 文字尺寸、行高

| 变量名称                | 说明                                                |
| ----------------------- | --------------------------------------------------- |
| --mu-common-font-size   | 普通文字尺寸，用于大部分组件的标题文字，默认值 14px |
| --mu-common-line-height | 普通行高，默认值 20px                               |



### 1.8 间距

| 变量名称             | 说明                       |
| -------------------- | -------------------------- |
| --mu-base-spacing    | 布局间距基准值，默认值 8px |
| --mu-content-spacing | 行内元素间距。默认值 5px   |



### 1.9 阴影

| 变量名称               | 说明（阴影由浅到深排列）           |
| ---------------------- | ---------------------------------- |
| --mu-shadow-focus-size | 焦点输入元素阴影尺寸               |
| --mu-shadow-float      | 突出元素阴影                       |
| --mu-shadow-popup      | 弹出元素阴影，如下拉框、消息提示等 |
| --mu-shadow-layer      | 浮动层元素阴影，如抽屉面板等       |
| --mu-shadow-modal      | 模态窗口阴影                       |



### 1.10 Z-INDEX

| 变量名称           | 说明                                 |
| ------------------ | ------------------------------------ |
| --mu-z-index-float | 突出元素层级                         |
| --mu-z-index-layer | 浮动层层级                           |
| --mu-z-index-modal | 模态窗口层级                         |
| --mu-z-index-popup | 弹出元素层级                         |
| --mu-z-index-ontop | 置顶层级，如消息提示、全局等待动画等 |



## 2 - 从 3.x 升级